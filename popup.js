document.addEventListener('DOMContentLoaded', function() {
  const collectButton = document.getElementById('collect-btn');
  const openOptionsButton = document.getElementById('open-options');
  const statusMessage = document.getElementById('status-message');

  // 检查配置是否已完成
  checkConfiguration();

  // 采集笔记数据按钮点击事件
  collectButton.addEventListener('click', async function() {
    try {
      // 检查配置
      const config = await chrome.storage.sync.get(['tableUrl', 'appToken', 'appSecret']);
      if (!config.tableUrl || !config.appToken || !config.appSecret) {
        showStatus('请先完成配置设置', 'warning');
        chrome.runtime.openOptionsPage();
        return;
      }

      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否在小红书笔记页面
      if (!tab.url.includes('xiaohongshu.com')) {
        showStatus('请在小红书笔记页面使用此插件', 'error');
        return;
      }

      // 执行内容脚本来提取数据
      chrome.tabs.sendMessage(tab.id, { action: 'extractNoteData' }, async function(response) {
        if (chrome.runtime.lastError) {
          showStatus('无法获取页面数据，请确保页面已完全加载', 'error');
          return;
        }

        if (!response || !response.success) {
          showStatus(response?.message || '未找到笔记内容，请确保在笔记详情页', 'error');
          return;
        }

        // 发送数据到飞书
        chrome.runtime.sendMessage(
          { 
            action: 'sendToFeishu', 
            noteData: response.data,
            config: config
          }, 
          function(feishuResponse) {
            if (feishuResponse.success) {
              showStatus('数据已成功保存到飞书多维表格', 'success');
            } else {
              showStatus(`保存失败: ${feishuResponse.message}`, 'error');
            }
          }
        );
      });
    } catch (error) {
      showStatus(`发生错误: ${error.message}`, 'error');
    }
  });

  // 打开配置页面按钮点击事件
  openOptionsButton.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // 检查配置是否已完成
  async function checkConfiguration() {
    const config = await chrome.storage.sync.get(['tableUrl', 'appToken', 'appSecret']);
    if (!config.tableUrl || !config.appToken || !config.appSecret) {
      showStatus('请先完成必要配置设置', 'warning');
    }
  }

  // 显示状态消息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
  }
}); 