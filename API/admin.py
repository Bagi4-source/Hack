from django.contrib import admin
from .models import Car, Requests, Notification, Station

# Register your models here.
admin.site.register(Car)
admin.site.register(Requests)
admin.site.register(Notification)
admin.site.register(Station)
# admin.site.register(C)