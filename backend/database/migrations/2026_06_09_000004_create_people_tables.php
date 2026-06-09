<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('contractor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee_id', 50)->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('license_number', 50)->nullable();
            $table->string('license_class', 20)->nullable();
            $table->date('license_expiry')->nullable();
            $table->string('license_state', 2)->nullable();
            $table->json('endorsements')->nullable();
            $table->date('hire_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_leave', 'terminated'])->default('active');
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->date('medical_cert_expiry')->nullable();
            $table->date('background_check_date')->nullable();
            $table->date('drug_test_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'employee_id']);
        });

        Schema::create('driver_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->enum('document_type', ['license', 'medical_cert', 'background_check', 'drug_test', 'training_cert', 'other']);
            $table->string('file_path', 500);
            $table->string('original_filename')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'expired', 'pending_review'])->default('active');
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('parent_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('relationship', ['mother', 'father', 'guardian', 'grandparent', 'other'])->nullable();
            $table->string('preferred_language', 10)->default('en');
            $table->json('notification_preferences')->nullable();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('student_number', 50)->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('grade', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->text('home_address')->nullable();
            $table->decimal('home_latitude', 10, 7)->nullable();
            $table->decimal('home_longitude', 10, 7)->nullable();
            $table->boolean('has_iep')->default(false);
            $table->boolean('requires_wheelchair')->default(false);
            $table->boolean('requires_aide')->default(false);
            $table->text('medical_notes')->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->enum('status', ['active', 'inactive', 'graduated', 'transferred'])->default('active');
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'student_number']);
        });

        Schema::create('parent_students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_account_id')->constrained('parent_accounts')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->enum('relationship', ['mother', 'father', 'guardian', 'grandparent', 'other'])->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('can_pickup')->default(true);
            $table->timestamps();

            $table->unique(['parent_account_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_students');
        Schema::dropIfExists('students');
        Schema::dropIfExists('parent_accounts');
        Schema::dropIfExists('driver_documents');
        Schema::dropIfExists('drivers');
    }
};
