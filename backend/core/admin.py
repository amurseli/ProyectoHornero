from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Campaign, Donation

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active']

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['title', 'creator', 'goal', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'description']

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ['donor', 'campaign', 'amount', 'created_at']
    list_filter = ['created_at']