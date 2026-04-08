package org.university.management.model;

import java.util.Objects;

public abstract class User {
    private String userId;
    private String email;
    private String password;
    private Role role;

    public User() {
    }

    public User(String userId, String email, String password, Role role) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    // Template methods from requirements
    public void login() {
        System.out.println("User " + email + " logged in.");
    }

    public void signup() {
        System.out.println("User " + email + " signed up.");
    }

    public void resetPassword(String newPassword) {
        this.password = newPassword;
        System.out.println("Password reset for " + email);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(userId, user.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }
}
