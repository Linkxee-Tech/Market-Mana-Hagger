variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "bucket_location" {
  type    = string
  default = "US"
}

variable "allowed_origins" {
  type = string
}

variable "image_orchestrator" {
  type = string
}

variable "image_vision" {
  type = string
}

variable "image_clip_worker" {
  type = string
}

variable "image_frontend" {
  type    = string
  default = ""
}

variable "firestore_location" {
  type    = string
  default = "nam5"
}

variable "gemini_secret_id" {
  type    = string
  default = "market-mama-gemini-api-key"
}

variable "gemini_api_key_value" {
  type      = string
  sensitive = true
}

variable "clip_worker_token" {
  type      = string
  sensitive = true
}

variable "redis_authorized_network" {
  type        = string
  description = "Full self_link of VPC network allowed to access Redis."
}
