resource "azurerm_resource_group" "resource_group" {
  name     = var.RESOURCE_GROUP
  location = var.LOCATION
}

resource "azurerm_storage_account" "storage_account" {
  name                     = "functionshuffle"
  resource_group_name      = var.RESOURCE_GROUP
  location                 = var.LOCATION
  account_tier             = "Standard"
  account_replication_type = "LRS"

  depends_on = [azurerm_resource_group.resource_group]
}

resource "azurerm_storage_container" "storage_account" {
  name                  = "function-shuffle-deployments"
  storage_account_name  = azurerm_storage_account.storage_account.name
  container_access_type = "private"

  depends_on = [azurerm_resource_group.resource_group]
}


module "function-app" {
  source                    = "./modules/function-app"
  LOCATION                  = var.LOCATION
  RESOURCE_GROUP            = var.RESOURCE_GROUP
  STORAGE_ACCOUNT_NAME      = azurerm_storage_account.storage_account.name
  STORAGE_ACCOUNT_KEY       = azurerm_storage_account.storage_account.primary_access_key
  STORAGE_ACCOUNT_CONNECTION_STRING = azurerm_storage_account.storage_account.primary_blob_connection_string

  depends_on = [azurerm_resource_group.resource_group]
}

module "table" {
  source                    = "./modules/table"
  STORAGE_ACCOUNT_NAME      = azurerm_storage_account.storage_account.name

  depends_on = [azurerm_storage_account.storage_account]
}
