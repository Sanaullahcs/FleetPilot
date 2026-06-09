<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('approved_by_user_id')->nullable()->after('organization_id')->constrained('users')->nullOnDelete();
            $table->foreignUuid('school_id')->nullable()->after('approved_by_user_id')->constrained('schools')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_id');
            $table->dropConstrainedForeignId('approved_by_user_id');
        });
    }
};
