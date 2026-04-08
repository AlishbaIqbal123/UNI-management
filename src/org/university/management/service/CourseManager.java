package org.university.management.service;

import org.university.management.model.*;
import java.util.*;

public class CourseManager {
    private List<Department> departments = new ArrayList<>();
    private List<Result> results = new ArrayList<>();

    public void addDepartment(Department department) {
        departments.add(department);
    }

    public void addResult(Result result) {
        results.add(result);
    }

    public List<Result> getResults() {
        return results;
    }

    public Course findCourseById(String id) {
        for (Department dept : departments) {
            for (Course course : dept.getCourseCatalog()) {
                if (course.getCourseID().equals(id)) {
                    return course;
                }
            }
        }
        return null;
    }

    public boolean registerForCourse(Student student, Course course) {
        if (!isValidForCourse(student, course)) return false;

        course.enrollStudent(student.getUserId());
        student.registerCourse(course);
        return true;
    }

    private boolean isValidForCourse(Student student, Course course) {
        for (String prereqId : course.getPrerequisites()) {
            boolean completed = results.stream()
                    .anyMatch(r -> r.getStudentID().equals(student.getUserId()) && r.getCourseID().equals(prereqId) && !r.getGrade().equals("F"));
            if (!completed) {
                System.out.println("Prerequisite " + prereqId + " not met for student " + student.getUserId());
                return false;
            }
        }
        return true;
    }
}
