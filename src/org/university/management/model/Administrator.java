package org.university.management.model;

import java.util.ArrayList;
import java.util.List;

public class Administrator extends User {
    private String adminName;
    private List<User> managedUsers = new ArrayList<>();

    public Administrator() {
        super();
        setRole(Role.ADMINISTRATOR);
    }

    public Administrator(String userId, String email, String password, String adminName) {
        super(userId, email, password, Role.ADMINISTRATOR);
        this.adminName = adminName;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }

    public void addUser(User user) {
        managedUsers.add(user);
        System.out.println("User " + user.getUserId() + " added.");
    }

    public void removeUser(String userId) {
        managedUsers.removeIf(u -> u.getUserId().equals(userId));
        System.out.println("User " + userId + " removed.");
    }

    public void modifyUser(String userId, User details) {
        for (int i = 0; i < managedUsers.size(); i++) {
            if (managedUsers.get(i).getUserId().equals(userId)) {
                managedUsers.set(i, details);
                System.out.println("User " + userId + " modified.");
                return;
            }
        }
    }

    public void generateReport(String type) {
        System.out.println("Generating report: " + type);
        // Implement report generation logic based on requirements
    }

    // Role, session, password reset, etc., are in User.java or could be in UserSessionManager.
}
