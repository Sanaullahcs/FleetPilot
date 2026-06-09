# Notification Templates

## Overview

All notification content is managed through the `notification_templates` table. Dispatchers can customize message copy, but the variable placeholders (`{{variable_name}}`) must remain for proper rendering.

---

## Template Variables Reference

| Variable | Source | Example |
|----------|--------|---------|
| `{{route_name}}` | `runs.run_id` | E-S613ABEA |
| `{{route_code}}` | `routes.code` | E-613 |
| `{{driver_name}}` | `users.first_name + last_name` | John Smith |
| `{{vehicle_number}}` | `vehicles.vehicle_number` | V-104 |
| `{{delay_minutes}}` | `run_assignments.delay_minutes` | 15 |
| `{{reason}}` | `run_assignments.delay_reason` | Traffic on Main St |
| `{{eta}}` | Calculated from delay | 8:00 AM |
| `{{stop_name}}` | `stops.name` | Stop A - Oak St |
| `{{pickup_time}}` | `run_stops.scheduled_time` | 7:27 AM |
| `{{dropoff_time}}` | `run_stops.scheduled_time` | 7:45 AM |
| `{{student_name}}` | `students.first_name + last_name` | Emma Johnson |
| `{{parent_name}}` | `students.parent_name` | Lisa Johnson |
| `{{request_number}}` | `on_demand_requests.request_number` | ODR-2026-0042 |
| `{{requester_name}}` | `on_demand_requests.requester_name` | Maria Garcia |
| `{{pickup_address}}` | `on_demand_requests.pickup_address` | 789 Pine St |
| `{{dropoff_address}}` | `on_demand_requests.dropoff_address` | Lincoln Elementary |
| `{{tracking_url}}` | Generated public URL | https://track.example.com/t/abc123 |
| `{{first_stop}}` | First non-garage stop name | Stop A - Oak St |
| `{{first_stop_time}}` | First non-garage stop time | 7:27 AM |
| `{{school_name}}` | `schools.name` | Lincoln Elementary |

---

## Built-in Templates

### 1. delay_alert
**Channels:** SMS, Email  
**Trigger:** Run delay detected (manual or GPS-based)  
**Recipients:** Parents of students on affected run, school contact

**SMS (160 chars max):**
```
K12 Transport Alert: {{route_name}} is running {{delay_minutes}} min late. New ETA: {{eta}}. Reason: {{reason}}.
```

**Email Subject:**
```
Route Delay Alert - {{route_name}}
```

**Email Body (Text):**
```
Dear Parent,

Route {{route_name}} ({{route_code}}) is currently running {{delay_minutes}} minutes late.

New estimated arrival at {{stop_name}}: {{eta}}
Reason: {{reason}}
Driver: {{driver_name}}
Vehicle: {{vehicle_number}}

We apologize for the inconvenience.

Metro K-12 Transportation
(555) 0100
```

**Email Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  .detail { margin: 10px 0; }
  .label { font-weight: bold; color: #666; }
</style></head>
<body>
  <div class="container">
    <h2> Route Delay Alert</h2>
    <div class="alert-box">
      <p><strong>{{route_name}}</strong> is running <strong>{{delay_minutes}} minutes late</strong>.</p>
    </div>
    <div class="detail"><span class="label">New ETA:</span> {{eta}}</div>
    <div class="detail"><span class="label">Reason:</span> {{reason}}</div>
    <div class="detail"><span class="label">Driver:</span> {{driver_name}}</div>
    <div class="detail"><span class="label">Vehicle:</span> {{vehicle_number}}</div>
    <hr>
    <p style="font-size: 12px; color: #666;">
      Metro K-12 Transportation | (555) 0100 | dispatch@metrok12.edu
    </p>
  </div>
</body>
</html>
```

---

### 2. run_started
**Channels:** SMS  
**Trigger:** Driver taps "Start Run"  
**Recipients:** Parents of students on run

**SMS:**
```
Good morning! {{driver_name}} has started {{route_name}}. First pickup: {{first_stop}} at {{first_stop_time}}.
```

---

### 3. run_completed
**Channels:** SMS  
**Trigger:** Driver taps "End Run"  
**Recipients:** School contact

**SMS:**
```
{{route_name}} has completed. All students delivered. Driver: {{driver_name}}. Time: {{dropoff_time}}.
```

---

### 4. student_pickup_complete
**Channels:** SMS  
**Trigger:** Driver marks pickup stop complete  
**Recipients:** Parent of specific student

**SMS:**
```
{{student_name}} was picked up at {{stop_name}} at {{pickup_time}}. Driver: {{driver_name}}. Vehicle: {{vehicle_number}}.
```

---

### 5. student_dropoff_complete
**Channels:** SMS  
**Trigger:** Driver marks dropoff stop complete  
**Recipients:** Parent of specific student

**SMS:**
```
{{student_name}} was dropped off at {{stop_name}} at {{dropoff_time}}. Have a great day!
```

---

### 6. on_demand_confirmed
**Channels:** SMS, Email  
**Trigger:** Dispatcher approves on-demand request  
**Recipients:** Requester

**SMS:**
```
Your ride {{request_number}} is confirmed! Pickup: {{pickup_time}} at {{pickup_address}}. Driver: {{driver_name}} will arrive in approx. {{eta}}.
```

**Email Subject:**
```
Transportation Confirmed - {{request_number}}
```

**Email Body (Text):**
```
Hello {{requester_name}},

Your transportation request has been confirmed!

Request #: {{request_number}}
Pickup: {{pickup_time}}
Pickup Location: {{pickup_address}}
Dropoff: {{dropoff_address}}
Driver: {{driver_name}}
Vehicle: {{vehicle_number}}

If you need to make changes, please call us at (555) 0100.

Thank you,
Metro K-12 Transportation
```

---

### 7. on_demand_driver_assigned
**Channels:** SMS  
**Trigger:** Driver assigned to on-demand run  
**Recipients:** Driver

**SMS:**
```
New assignment: {{request_number}}. Pickup {{pickup_address}} at {{pickup_time}}. Dropoff: {{dropoff_address}}. Fare: ${{fare_estimate}}.
```

---

### 8. on_demand_denied
**Channels:** SMS, Email  
**Trigger:** Dispatcher denies request  
**Recipients:** Requester

**SMS:**
```
We are unable to fulfill request {{request_number}} at this time. Reason: {{reason}}. Please call (555) 0100 for alternatives.
```

---

### 9. document_expiry_warning
**Channels:** Email (to admin/dispatcher)  
**Trigger:** Daily cron — documents expiring within 30 days  
**Recipients:** Admin, dispatcher

**Email Subject:**
```
️ Documents Expiring Soon — {{count}} items
```

**Email Body (Text):**
```
The following documents expire within 30 days:

DRIVERS:
{{#drivers}}
- {{driver_name}}: {{document_type}} expires {{expiry_date}} ({{days_remaining}} days)
{{/drivers}}

VEHICLES:
{{#vehicles}}
- {{vehicle_number}}: {{document_type}} expires {{expiry_date}} ({{days_remaining}} days)
{{/vehicles}}

Please renew before expiration to avoid service interruption.
```

---

### 10. contractor_application_received
**Channels:** Email  
**Trigger:** Contractor submits application  
**Recipients:** Admin

**Email Subject:**
```
New Contractor Application — {{first_name}} {{last_name}}
```

**Email Body:**
```
A new contractor application has been received.

Name: {{first_name}} {{last_name}}
Company: {{company_name}}
Vehicle: {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}
Capacity: {{vehicle_capacity}}

Review at: https://app.fleetpilot.com/contractors/applications/{{application_id}}
```

---

### 11. contractor_application_decision
**Channels:** Email, SMS  
**Trigger:** Admin approves or rejects application  
**Recipients:** Applicant

**Approved SMS:**
```
Congratulations {{first_name}}! Your contractor application has been approved. Login credentials have been sent to {{email}}. Welcome to the team!
```

**Rejected SMS:**
```
Thank you for your interest, {{first_name}}. We are unable to approve your application at this time. Reason: {{rejection_reason}}. You may reapply in 90 days.
```

---

### 12. emergency_alert
**Channels:** SMS, Email, Push  
**Trigger:** Manual dispatcher action or incident event  
**Recipients:** All parents on run, school contact, admin

**SMS:**
```
URGENT: {{route_name}} — {{emergency_type}}. All students are safe. {{message}}. Updates: {{tracking_url}} or call (555) 0100.
```

---

## Template Customization Guide

### For Dispatchers (UI)
1. Navigate to **Settings → Notifications**
2. Select template from list
3. Edit SMS copy (keep `{{variables}}` intact)
4. Edit email subject and body
5. Toggle channels (SMS / Email / Push)
6. Click **Save** — changes apply to future notifications only

### Variable Validation
- Missing variables render as `[unknown]`
- Invalid variables are logged in `notifications.error_message`
- Template preview available with sample data before saving

### Character Limits
| Channel | Limit | Behavior |
|---------|-------|----------|
| SMS | 160 chars | Truncates with `[...]` if exceeded |
| Email | None | HTML supported |
| Push | 256 chars | Truncates if exceeded |

---

*Templates v1.0 | 2026-06-05*
