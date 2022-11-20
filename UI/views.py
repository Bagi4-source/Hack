import pytesseract
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import cv2
import re
from django.contrib.auth.decorators import permission_required, login_required
from django.shortcuts import render, redirect, get_object_or_404, Http404
from django.template.loader import render_to_string
from django.views.generic import View
from .models import User, Station, Car, Requests, Post
from .forms import LoginForm, EditCar, CreateCar
from django.db.models.signals import pre_save
from django.contrib.auth import authenticate, login, logout, models
from django.utils.functional import SimpleLazyObject
from django.db.models import Q
import datetime
from .admin import UserResource, CarResource, RequestsResource
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from API.views import translation

pytesseract.pytesseract.tesseract_cmd = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'


def is_ajax(request):
    return request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest'


def home(request):
    # dataset = UserResource().export()
    # with open('output.xls', 'wb') as file:
    #     file.write(dataset.xls)
    user = request.user
    if user and user.id:
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        context = {
            'request': request,
            'cars': current_user.garage.all(),
            'user': current_user,
        }
        return render(request, 'UI/mobile.html', context)
    return redirect('login')


@permission_required('is_staff')
def admin_panel(request):
    context = {
        'user': request.user,
        'new_users': {
            '01-12-2002': 100,
            '02-12-2002': 100,
        },
        'requests': {
            '01-12-2002': 100,
            '02-12-2002': 100,
        },
        'cars': {
            '01-12-2002': 100,
            '02-12-2002': 100,
        }
    }
    return render(request, 'UI/admin.html', context=context)


def garage(request):
    user = request.user
    if user and user.id:
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        context = {
            'request': request,
            'cars': current_user.garage.all(),
            'user': current_user,
        }
        return render(request, 'UI/garage.html', context)
    return redirect('login')


def stats_ajax(request):
    user = request.user
    if user and user.id:
        stats_context = {
            "map": {
            },
            "news": {
                "news": Post.objects.all(),
            },
            "requests": {
                "requests": User.objects.prefetch_related('requests').get(user=user).requests.all().order_by("-id"),
            }
        }

        if request.method == "POST" and is_ajax(request):
            stat_name = request.POST.get('aria-label')

            return JsonResponse({
                'data': render_to_string(
                    request=request,
                    template_name=f"UI/{stat_name}.html",
                    context=stats_context.get(stat_name)
                )
            })
    return JsonResponse({})


def recogniser(request):
    user = request.user
    if user and user.id:
        if request.method == "POST" and is_ajax(request):
            data = request.FILES.get('0')
            path = default_storage.save(f"recogniser/{data}", ContentFile(data.read()))

            img = cv2.imread(path)
            text = pytesseract.image_to_string(img, lang='rus+eng', config='--psm 6 --oem 3')
            number = re.findall(r'([А-ЯA-Z]\d{3}[А-ЯA-Z]{2}\d{1,3})', text)[0]
            vin = re.findall(r'([A-Z\d]{17})', text)[0]
            seria = re.findall(r'(\d{2}\s*\d{2}\s*\d{6})', text)[0]
            model = re.findall(r'модель\s*([A-Za-z ]*)', text)[0].replace('модель', '').strip()

            return JsonResponse({
                'number': number,
                'vin': vin,
                'sts_number': seria,
                'model': model
            })
    return JsonResponse({})


def remove_car(request, pk):
    user = request.user
    if user and user.id:
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        car = get_object_or_404(current_user.garage, pk=pk)
        car.delete()
        return redirect('garage')
    return redirect('login')


class CarSettings(View):
    def get(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        user = request.user
        if not (user and user.id):
            return redirect('login')
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        car = get_object_or_404(current_user.garage, pk=pk)
        form = EditCar()
        context = {
            'user': current_user,
            'car': car,
            'form': form
        }
        return render(request, 'UI/car-settings.html', context)

    def post(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        user = request.user
        if not (user and user.id):
            return redirect('login')

        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        car = get_object_or_404(current_user.garage, pk=pk)

        form = EditCar(request.POST, request.FILES)
        context = {
            'car': car,
            'form': form
        }
        if form.is_valid():
            car.photo = form.instance.photo
            car.save()

        return redirect('car', pk)


class AddCar(View):
    def get(self, request, *args, **kwargs):
        user = request.user
        if not (user and user.id):
            return redirect('login')
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        form = CreateCar()
        context = {
            'user': current_user,
            'form': form
        }
        return render(request, 'UI/add-car.html', context)

    def post(self, request, *args, **kwargs):
        user = request.user
        if not (user and user.id):
            return redirect('login')

        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)

        form = CreateCar(request.POST, request.FILES)
        context = {
            'form': form
        }
        if form.is_valid():
            form.save()
            pk = form.instance.pk
            current_user.garage.add(form.instance)
            current_user.save()

            return redirect('car', pk)
        return redirect('garage')


def car_info(request, pk):
    user = request.user
    if user and user.id:
        current_user = get_object_or_404(User.objects.prefetch_related('garage'), user=user)
        context = {
            'request': request,
            'car': get_object_or_404(current_user.garage, pk=pk),
            'user': current_user,
        }
        return render(request, 'UI/car.html', context)
    return redirect('login')


def LogOut(request):
    logout(request)
    return redirect('login')


def registration(request):
    return JsonResponse({'a': 1})


class LoginView(View):
    def get(self, request, *args, **kwargs):
        if request.user is models.User:
            return redirect('home')
        else:
            form = LoginForm(request.POST or None)
            context = {
                'form': form
            }
            return render(request, 'UI/auth.html', context)

    def post(self, request, *args, **kwargs):
        fs = FileSystemStorage()
        form = LoginForm(request.POST)
        context = {
            'form': form
        }
        if form.is_valid():
            try:
                user = get_object_or_404(models.User, username__iexact=form.instance.email)
                if user.password == form.instance.password:
                    logout(request)
                    login(request, user)
                    return redirect('home')
                else:
                    return redirect('login')
            except Http404:
                form.save()
                form = form.instance
                user = models.User.objects.create(username=form.email, first_name=form.first_name,
                                                  last_name=form.last_name,
                                                  email=form.email, password=form.password)
                user.save()
                logout(request)
                login(request, user)
                form.user = user
                form.save()
                return redirect('registration')

        return render(request, 'UI/auth.html', context)


def user_pre_save(sender, instance, *args, **kwargs):
    instance.email = instance.email.lower()


def car_pre_save(sender, instance, *args, **kwargs):
    instance.number = translation(instance.number)


pre_save.connect(car_pre_save, sender=Car)
pre_save.connect(user_pre_save, sender=User)
