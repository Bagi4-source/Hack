from django.contrib import admin
from .models import User, Post, Car, Requests
from import_export import resources

# Register your models here.
admin.site.register(User)
admin.site.register(Post)


class UserResource(resources.ModelResource):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'patronymic', 'email', 'creation_date')


class CarResource(resources.ModelResource):
    class Meta:
        model = Car
        fields = ('id', 'number', 'vin', 'sts_number', 'email', 'model', 'fine', 'creation_date')


class RequestsResource(resources.ModelResource):
    class Meta:
        model = Requests
        fields = ('id', 'car__number', 'creation_date')
