from django.urls import path
from . import views
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('', views.home, name='home'),
    path('', views.home, name='fine'),
    path('garage/', views.garage, name='garage'),
    path('admin-panel/', views.admin_panel, name='admin-panel'),
    path('car/<int:pk>', views.car_info, name='car'),
    path('car/<int:pk>/remove/', views.remove_car, name='car-remove'),
    path('car/add/', views.AddCar.as_view(), name='add-car'),
    path('', views.home, name='profile'),

    path('login/', views.LoginView.as_view(), name='login'),
    path('registration/', views.registration, name='registration'),
    path('stat-cells/', views.stats_ajax, name='stat-cells'),
    path('recogniser/', views.recogniser, name='recogniser'),
    path('car-setting/<int:pk>', views.CarSettings.as_view(), name='car-setting'),
    path('car-info/<int:pk>', views.car_info, name='car-info'),
    # path('logout', views.LogOut, name='logout'),
    # path('sign-up/', views.RegistrationView.as_view(), name='sign-up')
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += staticfiles_urlpatterns()
