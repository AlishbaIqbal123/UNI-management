package org.university.management.util;

import org.university.management.model.*;
import java.util.List;

public class ReportGenerator {
    public static void generateStudentTranscript(Student student, List<Result> results) {
        System.out.println("---------- TRANSCRIPT ----------");
        System.out.println("Student Name: " + student.getName());
        System.out.println("Program: " + student.getProgram());
        System.out.println("Batch: " + student.getBatch());
        System.out.println("Courses & Grades:");
        for (Result r : results) {
            if (r.getStudentID().equals(student.getUserId())) {
                System.out.println("- " + r.getCourseID() + ": " + r.getGrade() + " (GPA: " + r.getGpa() + ")");
            }
        }
        System.out.println("--------------------------------");
    }

    public static void generateEnrollmentReport(List<Student> students) {
        System.out.println("---------- ENROLLMENT REPORT ----------");
        for (Student s : students) {
            System.out.println("Student: " + s.getName() + " (" + s.getUserId() + ") | Program: " + s.getProgram());
        }
        System.out.println("---------------------------------------");
    }
}
