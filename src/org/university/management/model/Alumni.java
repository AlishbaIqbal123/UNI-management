package org.university.management.model;

public class Alumni extends User {
    private String profession;
    private String graduationYear;

    public Alumni() {
        super();
        this.setRole(Role.GUEST); // Default guest or could have a specific ALUMNI role
    }

    public Alumni(String userId, String email, String password, String profession, String graduationYear) {
        super(userId, email, password, Role.GUEST);
        this.profession = profession;
        this.graduationYear = graduationYear;
    }

    public String getProfession() {
        return profession;
    }

    public void setProfession(String profession) {
        this.profession = profession;
    }

    public String getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(String graduationYear) {
        this.graduationYear = graduationYear;
    }
}
