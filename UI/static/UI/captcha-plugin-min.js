(function () {

    this.CaptchaPlugin = function (setting) {

        this.settings = Object.assign({
            labelText: '',
            errorText: '',
            captchaSimpleAttemptsCount: null,
            captchaBaseTime: null,
            captchaIncrementTime: null,
            widgetUri: '',
        }, setting);

        this.options = {
            apiUrl: this.settings.widgetUri || 'https://esia-portal1.test.gosuslugi.ru',
            typeCaptcha: {
                recaptcha: 'recaptcha',
                funcaptcha: 'funcaptcha',
                epgucaptcha: 'epgucaptcha',
                esiacaptcha: 'esiacaptcha',
            },
            errorType: {
                time: 'time',
                attempts: 'attempts',
            }
        };

        this.typeCaptcha = null;
        this.recaptchaHash = null;
        this.epguCaptchaId = null;
        this.captchaSession = null;
        this.canBeCheck = false;
        this.errorState = false;
        this.initEvent = document.createEvent('CustomEvent');

        this.countAttempt = 0;
        this.isTimer = false;

        if (this.settings.captchaIncrementTime) {
            this.settings.captchaBaseTime -= this.settings.captchaIncrementTime;
        }
    }

    // Public Methods
    CaptchaPlugin.prototype.init = function (container, callback) {
        let _ = this;
        this.container = container;

        sendRequest.call(_, 'GET', _.options.apiUrl + '/captcha/api/public/v2/type', null, function (config) {
                _.typeCaptcha = config.captchaType;
                if (config.captchaSession) {
                    _.captchaSession = config.captchaSession;
                }
                _.initEvent.initCustomEvent(
                    'initCaptcha',
                    false,
                    false,
                    {typeCaptcha: config.captchaType}
                );

                switch (_.typeCaptcha) {
                    case _.options.typeCaptcha.recaptcha:
                        initRecaptcha.call(_, config.sitekey);
                        break;
                    case _.options.typeCaptcha.funcaptcha:
                        initFuncaptcha.call(_);
                        break;
                    case _.options.typeCaptcha.esiacaptcha:
                        initEsiaCaptcha.call(_, {
                            renew: !config.hasOwnProperty('renew') || config.renew,
                            voice: !config.hasOwnProperty('voice') || config.voice
                        });
                        break;
                    default:
                        initEpgucaptcha.call(_);
                        break;
                }
                if (typeof callback === 'function') callback({typeCaptcha: _.typeCaptcha});
            }
        );
    }

    CaptchaPlugin.prototype.check = function (callback) {
        let _ = this,
            postData = {};
        postData.captchaType = _.typeCaptcha;
        let errorCallback = function (response) {
        };

        if (this.isTimer) {
            callback();
            return;
        }

        switch (_.typeCaptcha) {
            case _.options.typeCaptcha.recaptcha:
                postData.captchaResponse = _.recaptchaHash ? _.recaptchaHash : '';
                break;
            case _.options.typeCaptcha.funcaptcha:
                break;
            case _.options.typeCaptcha.esiacaptcha:
                let answer = document.getElementById('esia-captcha-value').value;
                if (!answer) {
                    callback();
                    break;
                }
                errorCallback = function (response) {
                    initError.call(_, response);
                };
                postData.answer = answer;
                _.canBeCheck = false;
                break;
            default:
                var answerVal = document.getElementById('epgu-captcha-value').value;
                if (!answerVal) {
                    callback();
                    return;
                }

                postData.captchaID = _.epguCaptchaId;
                postData.answer = answerVal
                _.canBeCheck = false;
                break;
        }

        sendRequest.call(
            _,
            'POST',
            _.options.apiUrl + '/captcha/api/public/v2/verify',
            postData,
            function (response) {
                callback(response.verify_token);
            },
            errorCallback
        );

    }

    CaptchaPlugin.prototype.reload = function () {
        var _ = this;
        this.countAttempt = 0;
        this.isTimer = false;
        window.clearInterval(_.interval);
        switch (this.typeCaptcha) {
            case this.options.typeCaptcha.epgucaptcha:
                initEpgucaptcha.call(_);
                break;
        }
    }

    CaptchaPlugin.prototype.setError = function () {

        if (this.isTimer) return;

        var _ = this;
        this.countAttempt++;

        switch (this.typeCaptcha) {
            case this.options.typeCaptcha.epgucaptcha:
                initEpgucaptcha.call(_);
                break;
        }
    }

    function initRecaptcha(siteKey) {
        var _ = this,
            cont = '<div id="re-captcha"></div>';

        document.getElementById(this.container).insertAdjacentHTML('beforeend', cont);

        window.verifyCallbackRecaptcha = function (response) {
            _.recaptchaHash = response;
        };

        window.onloadCallbackRecaptcha = function () {
            grecaptcha.render('re-captcha', {
                'sitekey': siteKey,
                'callback': verifyCallbackRecaptcha
            });
            document.dispatchEvent(_.initEvent);
        };

        loadScript.call(this, 'https://www.google.com/recaptcha/api.js?onload=onloadCallbackRecaptcha&render=explicit');
    }

    function initFuncaptcha() {
        console.log('Init FunCaptcha!!!');
    }

    function initEpgucaptcha() {
        let that = this;

        document.getElementById(that.container).innerHTML = '';

        if (this.settings.captchaSimpleAttemptsCount && this.countAttempt >= this.settings.captchaSimpleAttemptsCount) {
            getTimeCount.call(this);
            return;
        }

        sendRequest.call(that, 'GET', this.options.apiUrl + '/api/lk/v1/captcha', null, function (response) {

            that.epguCaptchaId = response.captchaId;

            var src = that.options.apiUrl + '/api/lk/v1/captcha/get?id=' + that.epguCaptchaId;

            var cont = '<div id="epgu-captcha">' +
                '<div class="img"><img src="' + src + '" /></div>' +
                '<div class="input">' +
                '<label for="epgu-captcha-value">' + that.settings.labelText + '</label>' +
                '<input type="text" id="epgu-captcha-value" />' +
                '</div>' +
                '</div>';

            if (that.countAttempt) {
                document.getElementById(that.container).classList.add('captcha-error');

                if (that.settings.errorText) {
                    cont += '<div class="epgu-captcha-error" id="epgu-captcha-error">' + that.settings.errorText + '</div>';
                }
            } else {
                document.getElementById(that.container).classList.remove('captcha-error');
            }

            document.getElementById(that.container).innerHTML = cont;

            document.getElementById('epgu-captcha-value').addEventListener('focus', function () {
                this.parentNode.classList.add('focus');
            }, true);

            document.getElementById('epgu-captcha-value').addEventListener('blur', function () {
                if (!this.value) {
                    this.parentNode.classList.remove('not-empty');
                }
                this.parentNode.classList.remove('focus');
            }, true);

            document.getElementById('epgu-captcha-value').addEventListener('keyup', function (ev) {
                that.canBeCheck = Boolean(this.value)
                if (this.value) {
                    that.canBeCheck = true;
                    document.getElementById(that.container).classList.remove('captcha-error');
                    this.parentNode.classList.add('not-empty');

                    if (document.getElementById('epgu-captcha-error')) {
                        document.getElementById('epgu-captcha-error').style.display = 'none';
                    }

                } else {
                    this.parentNode.classList.remove('not-empty');

                    if (document.getElementById('epgu-captcha-error')) {
                        document.getElementById('epgu-captcha-error').style.display = 'block';
                    }

                    if (that.countAttempt) {
                        document.getElementById(that.container).classList.add('captcha-error');
                    }
                }
            }, true);
            document.dispatchEvent(that.initEvent);
        });
    }

    function getTimeCount() {
        if (this.settings.captchaIncrementTime) {
            this.settings.captchaBaseTime += this.settings.captchaIncrementTime;
        }
        var that = this;
        var count = this.settings.captchaBaseTime;

        setHtmlCount.call(this, count--);
        that.isTimer = true;

        this.interval = window.setInterval(function () {
            setHtmlCount.call(that, count--);
            if (count < 0) {
                window.clearInterval(that.interval);
                that.reload();
                that.isTimer = false;
            }
        }, 1000);
    }

    function setHtmlCount(count) {
        document.getElementById(this.container).innerHTML = '<div class="count">Повторный ввод возможен будет через <span>' +
            decOfNum(count, ['секунду', 'секунды', 'секунд']) + '</span></div>';
    }

    function decOfNum(number, titles) {
        var cases = [2, 0, 1, 1, 1, 2];
        return number + ' ' + titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];

    }

    function loadScript(url) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function sendRequest(method, url, data, successCallback, errorCallback) {
        let that = this,
            xhr = new XMLHttpRequest(),
            json = data ? JSON.stringify(data) : null;

        xhr.open(method, url, true)
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '-1');
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        if (that.captchaSession) {
            xhr.setRequestHeader('captchaSession', that.captchaSession);
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                switch (xhr.status) {
                    case 200:
                        successCallback(JSON.parse(xhr.responseText));
                        break;
                    default:
                        if (errorCallback) {
                            let response;
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (error) {
                                response = {}
                            }
                            errorCallback(response)
                        }
                        break
                }
            }
        }
        xhr.send(json);
    }

    function initError(error) {
        let that = this,
            container = document.getElementById(that.container),
            title = '',
            description = '';
        that.errorState = true;

        switch (error.code) {
            case 'ESIA-00005':
                title = 'Слишком много попыток ввода';
                description = 'Вы несколько раз ввели код неправильно. Обновите страницу, чтобы получить новый код';
                break;
            case 'ESIA-00002':
            default:
                title = 'Страница устарела';
                description = 'Время на ввод кода вышло. Обновите страницу, чтобы получить новый код';
                break;
        }

        let content = '<div class="esia-captcha-error">'
            + '<div class="esia-captcha-error__circle">'
            + '<div class="esia-captcha-error__cross"></div>'
            + '</div>'
            + '<h3 class="esia-captcha-error__title">' + title + '</h3>'
            + '<p class="esia-captcha-error__description">' + description + '</p>'
            + '<div id="esia-captcha-error__refresh" class="esia-captcha-error__refresh">Обновить</div>'
            + '</div>';

        content += '<style>'
            + '.esia-captcha-error {display: flex; flex-direction: column; align-items: center;}'
            + '.esia-captcha-error__circle {display: flex; align-items: center; justify-content: center; width: 80px; height: 80px; border: 8px solid #c9d8fa; border-radius: 100%; margin-bottom: 24px;}'
            + '.esia-captcha-error__cross { position: relative; width: 40px; height: 40px;}'
            + '.esia-captcha-error__cross:before, .esia-captcha-error__cross:after {position: absolute; left: 15px; content: " "; height: 40px; width: 8px; background-color: #c9d8fa; border-radius: 6px;}'
            + '.esia-captcha-error__cross:before {transform: rotate(45deg);}'
            + '.esia-captcha-error__cross:after {transform: rotate(-45deg);}'
            + '.esia-captcha-error__title {max-width: 320px; line-height: 32px; margin-bottom: 12px; font-size: 24px; font-weight: bold; text-align: center;}'
            + '.esia-captcha-error__description {max-width: 320px; line-height: 24px; text-align: center;}'
            + '.esia-captcha-error__refresh {height: 52px; border-radius: 8px; border: none; padding: 14px 40px; box-sizing: border-box; font-size: 16px; line-height: 24px; color: #fff; background: #0d4cd3; cursor: pointer; width: 100%; text-align: center; margin-top: 40px; user-select: none;}'
            + '.esia-captcha-error__refresh_disabled {background: #e5eaf5; pointer-events: none;}'
            + '.esia-captcha-error__refresh:hover:not(.esia-captcha-error__refresh_disabled) {background: #1d5deb;}'
            + '</style>';

        container.innerHTML = content;
        const refreshButton = container.querySelector('#esia-captcha-error__refresh');
        refreshButton.onclick = function (event) {
            event.target.classList.add('esia-captcha-error__refresh_disabled');
            document.removeEventListener('keyup', refreshByEnter);
            that.init(that.container, function () {
                event.target.classList.remove('esia-captcha-error__refresh_disabled');
            });
        }

        function refreshByEnter(event) {
            if (event.code === 'Enter') {
                refreshButton.click();
            }
        }
        document.addEventListener('keyup', refreshByEnter);
    }

    function initEsiaCaptcha(config) {
        let that = this;
        getEsiaCaptcha.call(that, 'image', function (blob) {
                let content = '<div id="esia-captcha" class="esia-captcha">'
                    + '<img class="esia-captcha__img" alt="" id="esia-captcha-img" src="' + window.URL.createObjectURL(blob) + '""/>'
                    + '<div class="esia-captcha__buttons" id="esia-captcha-buttons"></div>'
                    + '<label for="esia-captcha-value" class="esia-captcha__label">Код</label>'
                    + '<input type="text" class="esia-captcha__input" id="esia-captcha-value" />'
                    + '</div>';

                content += '<style>'
                    + '.esia-captcha {width: 100%;}'
                    + '.esia-captcha__img {width: 100%; display: block; margin-bottom: 16px;}'
                    + '.esia-captcha__label {position: unset !important; font-weight: normal; font-size: 14px; margin-bottom: 4px; text-align: left; display: block; line-height: 20px;}'
                    + '.esia-captcha__buttons {margin-bottom: 32px; display: flex;}'
                    + '.esia-captcha__button {color: #0d4cd3; cursor: pointer; display: flex; align-items: center; line-height: 20px; border: none; background: none; user-select: none; font-size: 14px;}'
                    + '.esia-captcha__button-icon {animation: none; margin-right: 8px}'
                    + '.esia-captcha__button_disabled {pointer-events: none;}'
                    + '.esia-captcha__input {background: #f5f7fa; border-radius: 4px; height: 52px; padding: 14px 16px; border: none; display: block; outline: none; width: 100%; font-size: 16px; line-height: 24px;}'
                    + '.esia-captcha__input_error {background: #ee3f5829;}'
                    + '.esia-captcha__input:focus {border: none; outline: none;}'
                    + '.esia-captcha__button:not(:last-child) {margin-right: 32px}'
                    + '</style>';


                let container = document.getElementById(that.container);
                container.innerHTML = content;

                let player,
                    playerSource,
                    buttons = container.querySelector('#esia-captcha-buttons'),
                    loading = false;

                if (config.renew) {
                    const esiaCaptchaRenew = document.createElement('div');
                    esiaCaptchaRenew.id = 'esia-captcha-renew';
                    esiaCaptchaRenew.classList.add('esia-captcha__button');
                    esiaCaptchaRenew.innerHTML += '<svg class="esia-captcha__button-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                        + '<rect width="24" height="24" rx="12" fill="#E4ECFD"/>'
                        + '<path fill-rule="evenodd" clip-rule="evenodd" d="M15.4975 6.74923C15.4974 6.94847 15.4182 7.1395 15.2772 7.28021L13.057 9.49702L11.998 8.43463L12.935 7.49915H12V7.49995C9.51472 7.49995 7.5 9.51467 7.5 11.9999C7.5 14.4852 9.51472 16.4999 12 16.4999C14.4853 16.4999 16.5 14.4852 16.5 11.9999H18C18 15.3137 15.3137 17.9999 12 17.9999C8.68629 17.9999 6 15.3137 6 11.9999C6 8.68624 8.68629 5.99995 12 5.99995V5.99915H12.9368L11.9982 5.06091L13.0578 3.99915L15.2776 6.21813C15.4184 6.35892 15.4975 6.55 15.4975 6.74923Z" fill="#0D4CD3"/>'
                        + '</svg>Другой код';
                    buttons.appendChild(esiaCaptchaRenew);

                    /**
                     * Обработка клика для обновления каптчи
                     */
                    container.querySelector('#esia-captcha-renew').onclick = function (event) {
                        if (!loading) {
                            loading = true;
                            event.target.classList.add('esia-captcha__button_disabled');
                            renewEsiaCaptcha.call(
                                that,
                                function (blob) {
                                    container.querySelector('#esia-captcha-img').src = window.URL.createObjectURL(blob)
                                    if (playerSource) {
                                        playerSource.removeAttribute('src');
                                    }
                                    loading = false;
                                    event.target.classList.remove('esia-captcha__button_disabled');
                                },
                                function (error) {
                                    loading = false;
                                    event.target.classList.remove('esia-captcha__button_disabled');
                                    initError.call(that, error);
                                }
                            );
                        }
                    }
                }

                if (config.voice) {
                    const esiaCaptchaListen = document.createElement('div');
                    esiaCaptchaListen.id = 'esia-captcha-listen';
                    esiaCaptchaListen.classList.add('esia-captcha__button');
                    esiaCaptchaListen.innerHTML += '<svg class="esia-captcha__button-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                        + '<rect width="24" height="24" rx="12" fill="#E4ECFD"/>'
                        + '<path fill-rule="evenodd" clip-rule="evenodd" d="M16.1216 12.7302L9.62374 16.8879C9.12302 17.2083 8.5 16.8035 8.5 16.1577L8.5 7.84229C8.5 7.19651 9.12302 6.79166 9.62375 7.11206L16.1216 11.2698C16.6262 11.5926 16.6261 12.4074 16.1216 12.7302Z" fill="#0D4CD3"/>'
                        + '</svg>Прослушать'
                        + '<audio id="player"><source id="player-source" /></audio>';
                    buttons.appendChild(esiaCaptchaListen);

                    player = container.querySelector('#player');
                    playerSource = player.querySelector('#player-source');

                    /**
                     * Обработка клика для прослушивания каптчи
                     */
                    container.querySelector('#esia-captcha-listen').onclick = function (event) {
                        if (!loading) {
                            event.target.classList.add('esia-captcha__button_disabled');
                            if (!playerSource.src) {
                                loading = true;
                                getEsiaCaptcha.call(that, 'voice', function (blob) {
                                        playerSource.src = window.URL.createObjectURL(blob);
                                        player.load();
                                        player.play();
                                        loading = false;
                                        event.target.classList.remove('esia-captcha__button_disabled');
                                    },
                                    function (error) {
                                        loading = false;
                                        event.target.classList.remove('esia-captcha__button_disabled');
                                        initError.call(that, error);
                                    })
                            } else {
                                player.play();
                                event.target.classList.remove('esia-captcha__button_disabled');
                            }
                        }
                    }
                }

                container.querySelector('#esia-captcha-value').onkeyup = function () {
                    that.canBeCheck = Boolean(this.value)
                };
                that.errorState = false;
                document.dispatchEvent(that.initEvent);
            }, function (error) {
                initError.call(that, error);
            }
        )
    }

    function getEsiaCaptcha(type, successCallback, errorCallback) {
        let xhr = new XMLHttpRequest();
        let requestUrl = this.options.apiUrl + '/captcha/api/public/v2/' + type;
        if (type === 'voice') {
            requestUrl = this.options.apiUrl + '/captcha-audio-service/api/public/v2/' + type
        }

        xhr.open('GET', requestUrl, true)
        xhr.setRequestHeader('captchaSession', this.captchaSession);
        xhr.setRequestHeader('Pragma', 'no-cache');
        xhr.setRequestHeader('Expires', '-1');
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        xhr.onloadstart = function () {
            xhr.responseType = 'blob';
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                switch (xhr.status) {
                    case 200:
                        successCallback(xhr.response);
                        break;
                    default:
                        if (errorCallback) {
                            let response;
                            try {
                                response = JSON.parse(xhr.responseText);
                            } catch (error) {
                                response = {}
                            }
                            errorCallback(response)
                        }
                        break
                }
            }
        }
        xhr.send(null);
    }

    function renewEsiaCaptcha(successCallback, errorCallback) {
        let that = this
        sendRequest.call(
            that,
            'GET',
            that.options.apiUrl + '/captcha/api/public/v2/renew',
            null,
            function (response) {
                that.captchaSession = response.captchaSession;
                getEsiaCaptcha.call(that, 'image', successCallback, errorCallback);
            },
            errorCallback
        )
    }

}());

