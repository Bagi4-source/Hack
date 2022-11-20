from django.db import models


class Station(models.Model):
    address = models.CharField("Адрес", max_length=200)
    max_count = models.IntegerField("Максимальное количество мест")
    count = models.IntegerField("Количество занятых мест", default=0)

    def __str__(self):
        return self.address

    def free_count(self):
        return self.max_count - self.count

    class Meta:
        verbose_name = 'Станция'
        verbose_name_plural = 'Станции'


class Notification(models.Model):
    title = models.CharField("Заголовок", max_length=80)
    url = models.URLField("Ссылка")
    info = models.TextField(max_length=300)
    viewed = models.BooleanField(default=False, verbose_name="Просмотрено")
    creation_date = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'


class Car(models.Model):
    number = models.CharField('Гос номер', max_length=10, unique=True)
    vin = models.CharField('VIN номер', max_length=20, unique=True)
    sts_number = models.CharField('СТС серия и номер', max_length=20, unique=True)
    sts_photo = models.ImageField('Фото СТС', upload_to='media')
    model = models.CharField('Модель', max_length=100)
    photo = models.ImageField('Фото', upload_to='media')
    creation_date = models.DateTimeField("Дата создания", auto_now_add=True)
    fine = models.IntegerField('Штраф', default=0)

    class Meta:
        verbose_name = 'Автомобиль'
        verbose_name_plural = 'Автомобили'

    def __str__(self):
        return self.model


class Requests(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, blank=True)
    creation_date = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        verbose_name = 'Запрос'
        verbose_name_plural = 'Запросы'
