variable "LOCATION" {}
variable "RESOURCE_GROUP" {}
variable "STORAGE_ACCOUNT_NAME" {}
variable "STORAGE_ACCOUNT_KEY" {}
variable "STORAGE_ACCOUNT_CONNECTION_STRING" {}

resource "azurerm_application_insights" "application_insights" {
  name                = "function-shuffle-application-insights"
  location            = var.LOCATION
  resource_group_name = var.RESOURCE_GROUP
  application_type    = "Node.JS"
}

resource "azurerm_app_service_plan" "app_service_plan" {
  name                = "function-shuffle-plan"
  location            = var.LOCATION
  resource_group_name = var.RESOURCE_GROUP
  kind                = "Linux"
  reserved            = true

  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "function_app" {
  name                = "function-shuffle-app"
  location            = var.LOCATION
  resource_group_name = var.RESOURCE_GROUP
  https_only          = true
  app_service_plan_id = azurerm_app_service_plan.app_service_plan.id
  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "node",
    APPINSIGHTS_INSTRUMENTATIONKEY = azurerm_application_insights.application_insights.instrumentation_key,
    WEBSITE_RUN_FROM_PACKAGE = "1",
    TABLE_STORAGE_CONNECTION = var.STORAGE_ACCOUNT_CONNECTION_STRING
  }

  storage_account_name       = var.STORAGE_ACCOUNT_NAME
  storage_account_access_key = var.STORAGE_ACCOUNT_KEY

  os_type                    = "linux"
  version                    = "~3"

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_RUN_FROM_PACKAGE"]
    ]
  }

  site_config {
    linux_fx_version = "node|14"
  }
}
