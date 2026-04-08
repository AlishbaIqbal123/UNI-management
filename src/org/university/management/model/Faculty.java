package org.university.management.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class Faculty extends User {
    private String facultyName;
    private String departmentID;
    private List<Course> assignedCourses = new ArrayList<>();

    public Faculty() {
        super();
        this.setRole(Role.FACULTY);
    }

    public Faculty(String userId, String email, String password, String facultyName, String departmentID) {
        super(userId, email, password, Role.FACULTY);
        this.facultyName = facultyName;
        this.departmentID = departmentID;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public String getDepartmentID() {
        return departmentID;
    }

    public void setDepartmentID(String departmentID) {
        this.departmentID = departmentID;
    }

    public List<Course> getAssignedCourses() {
        return assignedCourses;
    }

    public void setAssignedCourses(List<Course> assignedCourses) {
        this.assignedCourses = assignedCourses;
    }

    public void assignGrades(String studentID, String courseID, String grade) {
        System.out.println("Faculty " + facultyName + " assigned grade " + grade + " to student " + studentID + " for course " + courseID);
        // Implementation logic (likely updates a Result object)
    }

    public void submitAttendance(String courseID, Date date) {
        System.out.println("Submission of attendance for course " + courseID + " on " + date);
        // Implementation logic
    }

    public void createAnnouncement(String courseID, String message) {
        System.out.println("Announcement for course " + courseID + ": " + message);
        // Implementation logic
    }
}
