from .models import User, Car
from django import forms
from django.db.models import Q


class LoginForm(forms.ModelForm):
    email = forms.TextInput()
    password = forms.TextInput()

    class Meta:
        model = User
        fields = ["email", "password"]
        widgets = {
            "email": forms.TextInput(
                attrs={'class': 'plain-input', 'autocomplete': "new-login",
                       'name': "Телефон  /  Email  /  СНИЛС",
                       "id": "login"}),
            "password": forms.PasswordInput(attrs={'class': 'plain-input', 'autocomplete': "new-password",
                                                   'name': "Пароль",
                                                   "id": "password"}),
        }


class CreateCar(forms.ModelForm):
    class Meta:
        model = Car
        fields = ["sts_photo", "number", "vin", "sts_number", "model", "photo"]


class EditCar(forms.ModelForm):
    class Meta:
        model = Car
        fields = ["photo"]
