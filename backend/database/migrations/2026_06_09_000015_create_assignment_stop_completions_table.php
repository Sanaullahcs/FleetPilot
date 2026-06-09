<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_stop_completions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('run_assignment_id')->constrained('run_assignments')->cascadeOnDelete();
            $table->uuid('run_stop_id');
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->unique(['run_assignment_id', 'run_stop_id']);
            $table->index('run_stop_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_stop_completions');
    }
};
