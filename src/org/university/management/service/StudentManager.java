package org.university.management.service;

import org.university.management.model.*;
import java.util.*;

public class StudentManager {
    private List<User> users = new ArrayList<>();

    public void addUser(User user) {
        users.add(user);
    }

    public void admitStudent(Student student) {
        addUser(student);
        System.out.println("Student " + student.getName() + " admitted to " + student.getProgram());
    }

    public List<User> getUsers() {
        return users;
    }

    public User findUserById(String id) {
        return users.stream().filter(u -> u.getUserId().equals(id)).findFirst().orElse(null);
    }

    public User authenticate(String email, String password) {
        return users.stream()
                .filter(u -> u.getEmail().equals(email) && u.getPassword().equals(password))
                .findFirst()
                .orElse(null);
    }
}
