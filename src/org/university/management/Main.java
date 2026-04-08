package org.university.management;

import org.university.management.model.*;
import org.university.management.service.UniversityManagementSystem;
import org.university.management.util.ReportGenerator;
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Starting University Management System...");

        UniversityManagementSystem ums = new UniversityManagementSystem();

        // 1. Setup Departments and Faculty
        Department cs = new Department("CS101", "Computer Science", "Dr. Khan");
        ums.addDepartment(cs);

        Faculty faculty1 = new Faculty("F01", "khan@university.edu", "pass123", "Dr. Khan", "CS101");
        ums.addUser(faculty1);

        // 2. Setup Courses (with Prerequisites)
        Course algo = new Course("ALGO1", "Algorithms", 4, "Spring 2026", "F01");
        Course prog = new Course("PROG1", "Programming Fundamentals", 3, "Fall 2025", "F01");
        algo.getPrerequisites().add("PROG1");

        cs.addCourse(prog);
        cs.addCourse(algo);

        // 3. Setup Students (Admissions)
        Student student = new Student("S101", "ahmed@edu.com", "ahmed@123", "Ahmed Khan", "2024", "BSCS");
        System.out.println("Processing student admission...");
        ums.admitStudent(student);

        // 4. Registration Process (Testing Prerequisite Check)
        System.out.println("--- Course Registration Test ---");
        System.out.println("Registering for Algorithms before Programming Fundamentals...");
        ums.registerForCourse("S101", "ALGO1"); // Should fail

        System.out.println("Registering for Programming Fundamentals...");
        ums.registerForCourse("S101", "PROG1"); // Should succeed

        // 5. Grading & Reports
        System.out.println("--- Grading & Reports Demo ---");
        Result progResult = new Result("R101", "S101", "PROG1", "A", 0.0f);
        progResult.calculateGPA();
        ums.addResult(progResult);
        
        System.out.println("After completing PROG1, attempting to register for Algorithms again...");
        ums.registerForCourse("S101", "ALGO1"); // Should succeed

        System.out.println("Generating Transcript for Ahmed Khan...");
        ReportGenerator.generateStudentTranscript(student, ums.getResults());

        // 6. Finance
        System.out.println("--- Finance Demo ---");
        ums.generateStudentInvoice("S101");

        System.out.println("UMS Demo completed.");
    }
}
