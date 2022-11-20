from django.urls import include, path, re_path
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
# router.register(r'(?P<client_id>\d+)/tasks', views.ClientTaskView, basename='Clients tasks')
router.register('cars', views.CarView)
router.register(r'car/(?P<number>\w+)', views.CarViewSelect, basename='Car')
# router.register('servers', views.ServerView)

urlpatterns = [
    path('', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('', include(router.urls)),
    # path('servers/<int:server_pk>/tasks/<int:task_pk>/add-progress/', views.add_progress, name='add-progress'),
    # path('servers/<int:server_pk>/add-thread/', views.add_thread, name='add-thread'),
    # path('servers/<int:server_pk>/rm-thread/', views.rm_thread, name='rm-thread')
]
