# Generated by Django 4.1.3 on 2022-11-19 19:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('API', '0002_alter_car_photo_alter_car_sts_photo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='car',
            name='photo',
            field=models.ImageField(upload_to='media', verbose_name='Фото'),
        ),
        migrations.AlterField(
            model_name='car',
            name='sts_photo',
            field=models.ImageField(upload_to='media', verbose_name='Фото СТС'),
        ),
    ]
