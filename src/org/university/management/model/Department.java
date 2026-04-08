package org.university.management.model;

import java.util.ArrayList;
import java.util.List;

public class Department {
    private String departmentID;
    private String departmentName;
    private String headOfDepartment;
    private List<Course> courseCatalog = new ArrayList<>();

    public Department() {
    }

    public Department(String departmentID, String departmentName, String headOfDepartment) {
        this.departmentID = departmentID;
        this.departmentName = departmentName;
        this.headOfDepartment = headOfDepartment;
    }

    public String getDepartmentID() {
        return departmentID;
    }

    public void setDepartmentID(String departmentID) {
        this.departmentID = departmentID;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }

    public String getHeadOfDepartment() {
        return headOfDepartment;
    }

    public void setHeadOfDepartment(String headOfDepartment) {
        this.headOfDepartment = headOfDepartment;
    }

    public List<Course> getCourseCatalog() {
        return courseCatalog;
    }

    public void addCourse(Course course) {
        courseCatalog.add(course);
        System.out.println("Course " + course.getCourseName() + " added to department " + departmentName);
    }

    public void removeCourse(String courseID) {
        courseCatalog.removeIf(c -> c.getCourseID().equals(courseID));
        System.out.println("Course " + courseID + " removed from department " + departmentName);
    }

    public void assignFaculty(String facultyID, String courseID) {
        for (Course course : courseCatalog) {
            if (course.getCourseID().equals(courseID)) {
                course.setFacultyID(facultyID);
                System.out.println("Faculty " + facultyID + " assigned to course " + courseID);
                return;
            }
        }
    }
}
