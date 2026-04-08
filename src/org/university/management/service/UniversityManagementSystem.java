package org.university.management.service;

import org.university.management.model.*;
import java.util.*;

/**
 * Refactored UniversityManagementSystem using Manager Delegation pattern.
 * Addresses God Class and Long Method code smells.
 */
public class UniversityManagementSystem {
    private StudentManager studentManager = new StudentManager();
    private CourseManager courseManager = new CourseManager();
    private FinanceManager financeManager = new FinanceManager();
    private List<Attendance> attendanceRecords = new ArrayList<>();

    // User management delegated
    public void addUser(User user) {
        studentManager.addUser(user);
        if (user instanceof Student) {
            FinancialRecord record = new FinancialRecord(UUID.randomUUID().toString(), user.getUserId(), 0.0f, 1500.0f, new Date());
            financeManager.addRecord(record);
        }
    }

    public void admitStudent(Student student) {
        studentManager.admitStudent(student);
    }

    public void addResult(Result result) {
        courseManager.addResult(result);
    }

    public List<Result> getResults() {
        return courseManager.getResults();
    }

    public List<User> getUsers() {
        return studentManager.getUsers();
    }

    public User authenticate(String email, String password) {
        return studentManager.authenticate(email, password);
    }

    // Course Registration with Prerequisite Validation
    public boolean registerForCourse(String studentId, String courseId) {
        Student student = (Student) findUserById(studentId);
        Course course = findCourseById(courseId);

        if (student == null || course == null) return false;

        // Delegated to CourseManager which handles validation
        return courseManager.registerForCourse(student, course);
    }

    // Helper find methods
    private User findUserById(String id) {
        return studentManager.findUserById(id);
    }

    private Course findCourseById(String id) {
        return courseManager.findCourseById(id);
    }

    public void addDepartment(Department department) {
        courseManager.addDepartment(department);
    }

    // Finance Management delegated
    public void generateStudentInvoice(String studentId) {
        financeManager.generateStudentInvoice(studentId);
    }

    // Attendance Management
    public void markStudentAttendance(String studentId, String courseId, boolean present) {
        Attendance record = new Attendance(UUID.randomUUID().toString(), studentId, courseId, new Date(), present);
        if (present) record.markPresent(); else record.markAbsent();
        attendanceRecords.add(record);
    }
}
