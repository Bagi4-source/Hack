from rest_framework import serializers
from . import models


class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Car
        fields = [
            'number',
            'model',
            'creation_date'
        ]
        read_only_fields = [
            'creation_date'
        ]
