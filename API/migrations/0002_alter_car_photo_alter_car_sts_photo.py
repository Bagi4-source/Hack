# Generated by Django 4.1.3 on 2022-11-19 19:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('API', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='car',
            name='photo',
            field=models.ImageField(upload_to='media/% Y/% m/% d/', verbose_name='Фото'),
        ),
        migrations.AlterField(
            model_name='car',
            name='sts_photo',
            field=models.ImageField(upload_to='media/% Y/% m/% d/', verbose_name='Фото СТС'),
        ),
    ]
