package org.university.management.model;

import java.util.ArrayList;
import java.util.List;

public class Course {
    private String courseID;
    private String courseName;
    private Integer credits;
    private String semester;
    private String facultyID;
    private List<String> enrolledStudentIDs = new ArrayList<>();
    private List<String> sections = new ArrayList<>();
    private List<String> prerequisites = new ArrayList<>();

    public Course() {
    }

    public Course(String courseID, String courseName, Integer credits, String semester, String facultyID) {
        this.courseID = courseID;
        this.courseName = courseName;
        this.credits = credits;
        this.semester = semester;
        this.facultyID = facultyID;
    }

    public List<String> getPrerequisites() {
        return prerequisites;
    }

    public void setPrerequisites(List<String> prerequisites) {
        this.prerequisites = prerequisites;
    }

    public String getCourseID() {
        return courseID;
    }

    public void setCourseID(String courseID) {
        this.courseID = courseID;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(String courseName) {
        this.courseName = courseName;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getFacultyID() {
        return facultyID;
    }

    public void setFacultyID(String facultyID) {
        this.facultyID = facultyID;
    }

    public List<String> getEnrolledStudentIDs() {
        return enrolledStudentIDs;
    }

    public void removeSection(String sectionId) {
        sections.remove(sectionId);
        System.out.println("Section " + sectionId + " removed.");
    }

    public void addSection(String sectionId) {
        sections.add(sectionId);
        System.out.println("Section " + sectionId + " added.");
    }

    public void getStudentsEnrolled() {
        System.out.println("Students enrolled in " + courseName + ": " + String.join(", ", enrolledStudentIDs));
    }

    public void enrollStudent(String studentId) {
        enrolledStudentIDs.add(studentId);
        System.out.println("Student " + studentId + " enrolled in " + courseName);
    }
}
