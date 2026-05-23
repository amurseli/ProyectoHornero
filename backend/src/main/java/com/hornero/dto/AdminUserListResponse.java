package com.hornero.dto;

import java.util.List;

public class AdminUserListResponse {
    private List<AdminUserResponse> items;
    private long totalUsers;
    private long totalAdmins;
    private long totalBlocked;
    private int page;
    private int size;
    private int totalPages;

    public List<AdminUserResponse> getItems() { return items; }
    public void setItems(List<AdminUserResponse> items) { this.items = items; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getTotalAdmins() { return totalAdmins; }
    public void setTotalAdmins(long totalAdmins) { this.totalAdmins = totalAdmins; }

    public long getTotalBlocked() { return totalBlocked; }
    public void setTotalBlocked(long totalBlocked) { this.totalBlocked = totalBlocked; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
