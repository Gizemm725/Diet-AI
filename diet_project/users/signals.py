from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Create with valid defaults to satisfy required validators; will be updated later
        UserProfile.objects.create(
            user=instance,
            age=25,
            weight=70.0,
            height=170.0,
            goal='healthy_eating',
            activity_level='moderate'
        )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
