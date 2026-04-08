package org.university.management.model;

import java.util.ArrayList;
import java.util.List;

public class Student extends User {
    private String name;
    private String batch;
    private String program;
    private List<Course> registeredCourses = new ArrayList<>();

    public Student() {
        super();
        this.setRole(Role.STUDENT);
    }

    public Student(String userId, String email, String password, String name, String batch, String program) {
        super(userId, email, password, Role.STUDENT);
        this.name = name;
        this.batch = batch;
        this.program = program;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
    }

    public String getProgram() {
        return program;
    }

    public void setProgram(String program) {
        this.program = program;
    }

    public List<Course> getRegisteredCourses() {
        return registeredCourses;
    }

    public void registerCourse(Course course) {
        if (course != null) {
            registeredCourses.add(course);
            System.out.println("Registered for course: " + course.getCourseName());
        }
    }

    public void viewResults() {
        System.out.println("Viewing results for " + name);
        // Implementation logic
    }

    public void viewAttendance() {
        System.out.println("Viewing attendance for " + name);
        // Implementation logic
    }

    public void dropCourse(String courseId) {
        registeredCourses.removeIf(c -> c.getCourseID().equals(courseId));
        System.out.println("Course " + courseId + " dropped.");
    }

    public int getCredits() {
        return registeredCourses.stream().mapToInt(Course::getCredits).sum();
    }
}
