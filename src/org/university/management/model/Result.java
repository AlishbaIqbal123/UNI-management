package org.university.management.model;

public class Result {
    private String resultID;
    private String studentID;
    private String courseID;
    private String grade;
    private Float gpa;

    public Result() {
    }

    public Result(String resultID, String studentID, String courseID, String grade, Float gpa) {
        this.resultID = resultID;
        this.studentID = studentID;
        this.courseID = courseID;
        this.grade = grade;
        this.gpa = gpa;
    }

    public String getResultID() {
        return resultID;
    }

    public void setResultID(String resultID) {
        this.resultID = resultID;
    }

    public String getStudentID() {
        return studentID;
    }

    public void setStudentID(String studentID) {
        this.studentID = studentID;
    }

    public String getCourseID() {
        return courseID;
    }

    public void setCourseID(String courseID) {
        this.courseID = courseID;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public Float getGpa() {
        return gpa;
    }

    public void setGpa(Float gpa) {
        this.gpa = gpa;
    }

    public void calculateGPA() {
        // Implement GPA calculation logic based on grade
        if (grade == null) return;
        switch (grade) {
            case "A": this.gpa = 4.0f; break;
            case "B": this.gpa = 3.0f; break;
            case "C": this.gpa = 2.0f; break;
            case "D": this.gpa = 1.0f; break;
            case "F": this.gpa = 0.0f; break;
            default: this.gpa = 0.0f; break;
        }
        System.out.println("GPA calculated for " + studentID + ": " + gpa);
    }

    public void updateGrade(String newGrade) {
        this.grade = newGrade;
        calculateGPA();
        System.out.println("Grade updated for " + studentID + " to " + newGrade);
    }
}
