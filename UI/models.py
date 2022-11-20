from django.db import models
from API.models import Car, Notification, Requests, Station
from django.contrib.auth.models import User as DjangoUser


# Create your models here.
class User(models.Model):
    esia_id = models.IntegerField('ID пользователя в ГосУслугах', blank=True, null=True)
    requests = models.ManyToManyField(Requests, blank=True, verbose_name='История запросов')
    user = models.ForeignKey(DjangoUser, on_delete=models.CASCADE, blank=True, null=True)
    first_name = models.CharField('Имя', max_length=50, default='Герман')
    last_name = models.CharField('Фамилия', max_length=50, default='Багдасарян')
    patronymic = models.CharField('Отчество', max_length=50, blank=True)
    email = models.CharField('e-mail', max_length=100)
    password = models.CharField('password', max_length=100)
    notifications = models.ManyToManyField(Notification, blank=True, verbose_name='Уведомления')
    garage = models.ManyToManyField(Car, blank=True)
    creation_date = models.DateTimeField("Дата создания", auto_now_add=True)
    favorite_station = models.ManyToManyField(Station, verbose_name='Избранные станции', blank=True)

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.first_name.strip()

    def fine(self):
        return sum([car.fine for car in self.garage.all()])

    def has_notifications(self):
        return bool(self.notifications.filter(viewed=False))


class Post(models.Model):
    reviews = models.ManyToManyField(User, blank=True)
    likes = models.IntegerField('likes', default=0)
    dislikes = models.IntegerField('dislikes', default=0)
    content = models.TextField('Контент')
    creation_date = models.DateTimeField("Дата создания", auto_now_add=True)

    class Meta:
        verbose_name = 'Пост'
        verbose_name_plural = 'Посты'

    def __str__(self):
        return self.content
