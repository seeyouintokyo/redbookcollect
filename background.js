// 监听来自弹出窗口的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sendToFeishu') {
    sendToFeishu(request.noteData, request.config)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          message: error.message 
        });
      });
    
    return true; // 保持消息通道开放，以便异步返回结果
  }
});

// 获取飞书访问令牌
async function getFeishuToken(appId, appSecret) {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const data = await response.json();
    
    if (!data.tenant_access_token) {
      throw new Error(data.msg || '获取飞书访问令牌失败');
    }
    
    return data.tenant_access_token;
  } catch (error) {
    throw new Error(`获取飞书访问令牌失败: ${error.message}`);
  }
}

// 发送数据到飞书多维表格
async function sendToFeishu(noteData, config) {
  try {
    // 从存储中获取解析后的app_token和table_id
    const result = await chrome.storage.sync.get(['parsedAppToken', 'parsedTableId']);
    const appToken = result.parsedAppToken;
    const tableId = result.parsedTableId;
    
    if (!appToken || !tableId) {
      throw new Error('找不到有效的表格信息，请检查配置');
    }
    
    // 获取飞书访问令牌
    const accessToken = await getFeishuToken(config.appToken, config.appSecret);
    
    // 构建API请求
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(noteData)
    });
    
    const responseData = await response.json();
    
    if (response.ok && responseData.code === 0) {
      return {
        success: true,
        data: responseData.data
      };
    } else {
      throw new Error(responseData.msg || '写入飞书表格失败');
    }
  } catch (error) {
    throw new Error(`发送数据到飞书失败: ${error.message}`);
  }
} 