document.addEventListener('DOMContentLoaded', function() {
  const tableUrlInput = document.getElementById('table-url');
  const appTokenInput = document.getElementById('app-token');
  const appSecretInput = document.getElementById('app-secret');
  const saveButton = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');

  // 加载已保存的配置
  loadSavedConfig();

  // 保存按钮点击事件
  saveButton.addEventListener('click', function() {
    saveConfig();
  });

  // 加载已保存的配置
  function loadSavedConfig() {
    chrome.storage.sync.get(['tableUrl', 'appToken', 'appSecret'], function(result) {
      if (result.tableUrl) {
        tableUrlInput.value = result.tableUrl;
      }
      if (result.appToken) {
        appTokenInput.value = result.appToken;
      }
      if (result.appSecret) {
        appSecretInput.value = result.appSecret;
      }
    });
  }

  // 保存配置
  function saveConfig() {
    const tableUrl = tableUrlInput.value.trim();
    const appToken = appTokenInput.value.trim();
    const appSecret = appSecretInput.value.trim();

    // 验证输入
    if (!tableUrl || !appToken || !appSecret) {
      showStatus('所有字段都必须填写', 'error');
      return;
    }

    // 解析表格URL，提取app_token和table_id
    try {
      const urlInfo = parseTableUrl(tableUrl);
      
      // 保存配置
      chrome.storage.sync.set({
        tableUrl: tableUrl,
        appToken: appToken,
        appSecret: appSecret,
        parsedAppToken: urlInfo.appToken,
        parsedTableId: urlInfo.tableId
      }, function() {
        showStatus('配置已保存', 'success');
      });
    } catch (error) {
      showStatus(`表格URL格式无效: ${error.message}`, 'error');
    }
  }

  // 解析飞书多维表格URL
  function parseTableUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const baseIndex = pathParts.indexOf('base');
      
      if (baseIndex === -1 || baseIndex + 1 >= pathParts.length) {
        throw new Error('URL格式不正确');
      }
      
      const appToken = pathParts[baseIndex + 1];
      
      // 从查询参数中获取table_id
      const params = new URLSearchParams(urlObj.search);
      const tableId = params.get('table');
      
      if (!tableId) {
        throw new Error('未找到表格ID');
      }
      
      return {
        appToken: appToken,
        tableId: tableId
      };
    } catch (error) {
      throw new Error('无法解析表格URL: ' + error.message);
    }
  }

  // 显示状态消息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    
    // 3秒后自动隐藏成功消息
    if (type === 'success') {
      setTimeout(function() {
        statusMessage.textContent = '';
        statusMessage.className = '';
      }, 3000);
    }
  }
}); 