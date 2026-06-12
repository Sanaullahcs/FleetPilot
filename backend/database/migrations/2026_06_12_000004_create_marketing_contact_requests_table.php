<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_contact_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name', 120);
            $table->string('email', 255);
            $table->string('phone', 30)->nullable();
            $table->string('organization_name', 255)->nullable();
            $table->enum('inquiry_type', ['demo', 'pricing', 'support', 'partnership', 'other'])->default('demo');
            $table->enum('role_type', ['district', 'contractor', 'school', 'other'])->default('district');
            $table->string('fleet_size', 40)->nullable();
            $table->string('subject', 200)->nullable();
            $table->text('message');
            $table->string('source', 40)->default('website');
            $table->enum('status', ['new', 'read', 'archived'])->default('new');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->foreignUuid('read_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_contact_requests');
    }
};
