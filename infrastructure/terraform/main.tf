terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_service_account" "run_runtime" {
  account_id   = "market-mama-runtime"
  display_name = "Market Mama Cloud Run Runtime"
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = var.gemini_secret_id
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "gemini_api_key_version" {
  secret      = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key_value
}

resource "google_cloud_run_v2_service" "mama_orchestrator" {
  name     = "mama-orchestrator"
  location = var.region

  template {
    service_account = google_service_account.run_runtime.email
    timeout         = "300s"

    containers {
      image = var.image_orchestrator

      resources {
        limits = {
          cpu    = "2"
          memory = "1Gi"
        }
      }

      env {
        name  = "APP_ENV"
        value = "production"
      }
      env {
        name  = "ALLOW_DEV_AUTH_BYPASS"
        value = "false"
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = var.allowed_origins
      }
      env {
        name  = "FIRESTORE_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "CLIP_WORKER_URL"
        value = google_cloud_run_v2_service.mama_clip_worker.uri
      }
      env {
        name  = "CLIP_TASKS_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "CLIP_TASKS_LOCATION"
        value = var.region
      }
      env {
        name  = "CLIP_TASKS_QUEUE"
        value = google_cloud_tasks_queue.clip_generation.name
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.clips.name
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.memorystore.host}:${google_redis_instance.memorystore.port}"
      }
      env {
        name  = "CLIP_WORKER_TOKEN"
        value = var.clip_worker_token
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 20
    }
  }
}

resource "google_cloud_run_v2_service" "mama_vision" {
  name     = "mama-vision"
  location = var.region

  template {
    service_account = google_service_account.run_runtime.email
    timeout         = "180s"

    containers {
      image = var.image_vision

      resources {
        limits = {
          cpu    = "1"
          memory = "768Mi"
        }
      }

      env {
        name  = "APP_ENV"
        value = "production"
      }
      env {
        name  = "ALLOW_DEV_AUTH_BYPASS"
        value = "false"
      }
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.memorystore.host}:${google_redis_instance.memorystore.port}"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }
}

resource "google_cloud_run_v2_service" "mama_clip_worker" {
  name     = "mama-clip-worker"
  location = var.region

  template {
    service_account = google_service_account.run_runtime.email
    timeout         = "900s"

    containers {
      image = var.image_clip_worker

      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }

      env {
        name  = "APP_ENV"
        value = "production"
      }
      env {
        name  = "ALLOW_DEV_AUTH_BYPASS"
        value = "false"
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.clips.name
      }
      env {
        name  = "CLIP_WORKER_TOKEN"
        value = var.clip_worker_token
      }
      env {
        name  = "FFMPEG_BINARY"
        value = "ffmpeg"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }
}

resource "google_cloud_run_v2_service" "mama_frontend" {
  count    = var.image_frontend == "" ? 0 : 1
  name     = "mama-frontend"
  location = var.region

  template {
    service_account = google_service_account.run_runtime.email
    timeout         = "120s"

    containers {
      image = var.image_frontend

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }
}

resource "google_cloud_run_service_iam_member" "orchestrator_public_invoker" {
  location = google_cloud_run_v2_service.mama_orchestrator.location
  service  = google_cloud_run_v2_service.mama_orchestrator.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "vision_public_invoker" {
  location = google_cloud_run_v2_service.mama_vision.location
  service  = google_cloud_run_v2_service.mama_vision.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "clip_public_invoker" {
  location = google_cloud_run_v2_service.mama_clip_worker.location
  service  = google_cloud_run_v2_service.mama_clip_worker.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public_invoker" {
  count    = var.image_frontend == "" ? 0 : 1
  location = google_cloud_run_v2_service.mama_frontend[0].location
  service  = google_cloud_run_v2_service.mama_frontend[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_firestore_database" "default" {
  project                           = var.project_id
  name                              = "(default)"
  location_id                       = var.firestore_location
  type                              = "FIRESTORE_NATIVE"
  concurrency_mode                  = "OPTIMISTIC"
  app_engine_integration_mode       = "DISABLED"
  delete_protection_state           = "DELETE_PROTECTION_DISABLED"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
}

resource "google_redis_instance" "memorystore" {
  name               = "market-mama-redis"
  tier               = "BASIC"
  memory_size_gb     = 1
  region             = var.region
  authorized_network = var.redis_authorized_network
  redis_version      = "REDIS_7_0"
  display_name       = "market-mama-cache"
}

resource "google_storage_bucket" "screenshots" {
  name                        = "${var.project_id}-mama-screenshots"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  force_destroy               = false

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 3
    }
  }
}

resource "google_storage_bucket" "clips" {
  name                        = "${var.project_id}-mama-clips"
  location                    = var.bucket_location
  uniform_bucket_level_access = true
  force_destroy               = false

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30
    }
  }
}

resource "google_storage_bucket_iam_member" "clips_public_read" {
  bucket = google_storage_bucket.clips.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_cloud_tasks_queue" "clip_generation" {
  name     = "mama-clip-generation"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = 20
    max_dispatches_per_second = 5
  }

  retry_config {
    max_attempts       = 8
    min_backoff        = "5s"
    max_backoff        = "120s"
    max_doublings      = 4
    max_retry_duration = "1800s"
  }
}

resource "google_monitoring_uptime_check_config" "orchestrator_uptime" {
  display_name = "Market Mama Orchestrator Uptime"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = replace(google_cloud_run_v2_service.mama_orchestrator.uri, "https://", "")
    }
  }
}

resource "google_monitoring_alert_policy" "error_rate_alert" {
  display_name = "Market Mama Cloud Run Error Rate > 5%"
  combiner     = "OR"

  conditions {
    display_name = "HTTP 5xx ratio"
    condition_threshold {
      filter = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\""
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.label.service_name", "metric.label.response_code_class"]
      }
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      duration        = "300s"
      trigger {
        count = 1
      }
    }
  }

  enabled = true
}
