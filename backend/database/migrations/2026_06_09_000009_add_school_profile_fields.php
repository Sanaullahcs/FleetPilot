<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('district')->nullable()->after('code');
            $table->string('grade_levels', 50)->nullable()->after('district');
            $table->string('principal_name')->nullable()->after('contact_phone');
            $table->string('website')->nullable()->after('principal_name');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn(['district', 'grade_levels', 'principal_name', 'website']);
        });
    }
};
