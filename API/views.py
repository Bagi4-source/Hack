from django.shortcuts import render
from rest_framework import viewsets, mixins, generics
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from .models import Car, Requests
from UI.models import User
from . import serializers
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.http import JsonResponse


# Create your views here.
def translation(number):
    number = number.upper()
    dic = {
        'A': 'А',
        'B': 'В',
        'E': 'Е',
        'K': 'К',
        'M': 'М',
        'H': 'Н',
        'O': 'О',
        'P': 'Р',
        'C': 'С',
        'T': 'Т',
        'Y': 'У',
        'X': 'Х'
    }
    for key, value in dic.items():
        number = number.replace(key, value)
    return number


class CarView(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    permission_classes = [AllowAny]
    serializer_class = serializers.CarSerializer
    queryset = Car.objects.all()


class CarViewSelect(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin):
    authentication_classes = [SessionAuthentication, BasicAuthentication]
    permission_classes = [AllowAny]
    serializer_class = serializers.CarSerializer

    def get_queryset(self):
        car = Car.objects.filter(number__iexact=translation(self.kwargs.get('number')))
        if car.exists():
            user = User.objects.get(garage__exact=car.first())

            request = Requests.objects.create(car=car.first())
            request.save()

            user.requests.add(request)
            user.save()
            return car
