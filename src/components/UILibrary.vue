<template>
  <div class="ui-library">
    <header class="library-header">
      <h1 class="text-gradient">🎨 UIコンポーネントライブラリ</h1>
      <p class="header-description">
        美しく使いやすいUIコンポーネントで、素晴らしいユーザーエクスペリエンスを提供します
      </p>
    </header>

    <div class="library-content">
      <!-- ボタンセクション -->
      <section class="component-section">
        <h2 class="section-title">🔘 ボタンコンポーネント</h2>
        <div class="component-showcase">
          <div class="showcase-item">
            <h3>基本ボタン</h3>
            <div class="button-grid">
              <button class="btn btn-primary">プライマリ</button>
              <button class="btn btn-secondary">セカンダリ</button>
              <button class="btn btn-outline">アウトライン</button>
              <button class="btn btn-ghost">ゴースト</button>
              <button class="btn btn-gradient">グラデーション</button>
            </div>
          </div>

          <div class="showcase-item">
            <h3>サイズバリエーション</h3>
            <div class="button-grid">
              <button class="btn btn-primary btn-sm">小</button>
              <button class="btn btn-primary">標準</button>
              <button class="btn btn-primary btn-lg">大</button>
              <button class="btn btn-primary btn-xl">特大</button>
            </div>
          </div>

          <div class="showcase-item">
            <h3>アイコン付きボタン</h3>
            <div class="button-grid">
              <button class="btn btn-primary">
                <span>📁</span> 開く
              </button>
              <button class="btn btn-secondary">
                <span>💾</span> 保存
              </button>
              <button class="btn btn-outline">
                <span>🔄</span> 更新
              </button>
              <button class="btn btn-ghost">
                <span>❌</span> キャンセル
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- カードセクション -->
      <section class="component-section">
        <h2 class="section-title">🃏 カードコンポーネント</h2>
        <div class="component-showcase">
          <div class="card-grid">
            <div class="card card-interactive hover-lift">
              <div class="card-header">
                <h3>基本カード</h3>
              </div>
              <div class="card-body">
                <p>これは基本的なカードコンポーネントです。クリック可能で、ホバー効果があります。</p>
              </div>
              <div class="card-footer">
                <button class="btn btn-sm btn-primary">詳細</button>
              </div>
            </div>

            <div class="card creative-gradient">
              <div class="card-body">
                <h3>グラデーションカード</h3>
                <p>美しいグラデーション背景のカードです。</p>
                <button class="btn btn-outline" style="color: white; border-color: white;">
                  アクション
                </button>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="card-icon">🚀</div>
                <h3>アイコンカード</h3>
                <p>アイコンが特徴的なカードデザインです。</p>
                <div class="card-stats">
                  <div class="stat">
                    <span class="stat-value">124</span>
                    <span class="stat-label">ユーザー</span>
                  </div>
                  <div class="stat">
                    <span class="stat-value">89%</span>
                    <span class="stat-label">満足度</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- フォームセクション -->
      <section class="component-section">
        <h2 class="section-title">📝 フォームコンポーネント</h2>
        <div class="component-showcase">
          <div class="form-showcase">
            <div class="form-column">
              <h3>基本フォーム</h3>
              <form class="modern-form">
                <div class="form-group">
                  <label class="form-label">名前</label>
                  <input type="text" class="form-input" placeholder="お名前を入力">
                </div>
                <div class="form-group">
                  <label class="form-label">メールアドレス</label>
                  <input type="email" class="form-input" placeholder="example@email.com">
                </div>
                <div class="form-group">
                  <label class="form-label">メッセージ</label>
                  <textarea class="form-input" rows="4" placeholder="メッセージを入力"></textarea>
                </div>
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" class="form-checkbox">
                    利用規約に同意する
                  </label>
                </div>
                <button type="submit" class="btn btn-primary">送信</button>
              </form>
            </div>

            <div class="form-column">
              <h3>高度なフォーム</h3>
              <form class="modern-form">
                <div class="form-group">
                  <label class="form-label">カテゴリ</label>
                  <select class="form-input">
                    <option>選択してください</option>
                    <option>技術</option>
                    <option>デザイン</option>
                    <option>マーケティング</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">優先度</label>
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" name="priority" value="low">
                      <span class="radio-custom"></span>
                      低
                    </label>
                    <label class="radio-label">
                      <input type="radio" name="priority" value="medium">
                      <span class="radio-custom"></span>
                      中
                    </label>
                    <label class="radio-label">
                      <input type="radio" name="priority" value="high">
                      <span class="radio-custom"></span>
                      高
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">進捗</label>
                  <div class="progress">
                    <div class="progress-bar" style="width: 65%"></div>
                  </div>
                  <span class="progress-text">65%</span>
                </div>
                <button type="submit" class="btn btn-gradient">作成</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <!-- ナビゲーションセクション -->
      <section class="component-section">
        <h2 class="section-title">🧭 ナビゲーションコンポーネント</h2>
        <div class="component-showcase">
          <div class="nav-showcase">
            <h3>タブナビゲーション</h3>
            <nav class="nav tab-nav">
              <a href="#" class="nav-item active">ダッシュボード</a>
              <a href="#" class="nav-item">プロジェクト</a>
              <a href="#" class="nav-item">チーム</a>
              <a href="#" class="nav-item">設定</a>
            </nav>

            <h3>ピルナビゲーション</h3>
            <nav class="nav pill-nav">
              <a href="#" class="nav-item">📊 分析</a>
              <a href="#" class="nav-item active">📈 レポート</a>
              <a href="#" class="nav-item">⚙️ 設定</a>
            </nav>

            <h3>ブレッドクラム</h3>
            <nav class="breadcrumb">
              <a href="#" class="breadcrumb-item">ホーム</a>
              <span class="breadcrumb-separator">></span>
              <a href="#" class="breadcrumb-item">プロジェクト</a>
              <span class="breadcrumb-separator">></span>
              <span class="breadcrumb-item active">設定</span>
            </nav>
          </div>
        </div>
      </section>

      <!-- バッジ・タグセクション -->
      <section class="component-section">
        <h2 class="section-title">🏷️ バッジ・タグコンポーネント</h2>
        <div class="component-showcase">
          <div class="badge-showcase">
            <h3>ステータスバッジ</h3>
            <div class="badge-grid">
              <span class="badge badge-primary">新着</span>
              <span class="badge badge-secondary">処理中</span>
              <span class="badge badge-success">完了</span>
              <span class="badge badge-warning">保留</span>
              <span class="badge badge-error">エラー</span>
            </div>

            <h3>アウトラインバッジ</h3>
            <div class="badge-grid">
              <span class="badge badge-outline" style="color: var(--color-primary); border-color: var(--color-primary);">重要</span>
              <span class="badge badge-outline" style="color: var(--color-secondary); border-color: var(--color-secondary);">承認済み</span>
              <span class="badge badge-outline" style="color: var(--color-warning); border-color: var(--color-warning);">注意</span>
            </div>

            <h3>数値バッジ</h3>
            <div class="badge-grid">
              <div class="badge-container">
                <span>📧 メッセージ</span>
                <span class="badge badge-error">12</span>
              </div>
              <div class="badge-container">
                <span>🔔 通知</span>
                <span class="badge badge-primary">3</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- アラートセクション -->
      <section class="component-section">
        <h2 class="section-title">⚠️ アラートコンポーネント</h2>
        <div class="component-showcase">
          <div class="alert-showcase">
            <div class="alert alert-success">
              <span class="alert-icon">✅</span>
              <div>
                <strong>成功！</strong> 操作が正常に完了しました。
              </div>
            </div>

            <div class="alert alert-warning">
              <span class="alert-icon">⚠️</span>
              <div>
                <strong>注意！</strong> この操作は元に戻せません。
              </div>
            </div>

            <div class="alert alert-error">
              <span class="alert-icon">❌</span>
              <div>
                <strong>エラー！</strong> 接続に失敗しました。再試行してください。
              </div>
            </div>

            <div class="alert alert-info">
              <span class="alert-icon">ℹ️</span>
              <div>
                <strong>情報</strong> 新しい機能が利用可能です。
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ローディング・プログレスセクション -->
      <section class="component-section">
        <h2 class="section-title">⏳ ローディング・プログレスコンポーネント</h2>
        <div class="component-showcase">
          <div class="loading-showcase">
            <h3>ローディングスピナー</h3>
            <div class="loading-grid">
              <div class="loading-item">
                <div class="loading"></div>
                <span>基本</span>
              </div>
              <div class="loading-item">
                <div class="loading loading-lg"></div>
                <span>大</span>
              </div>
              <div class="loading-item">
                <div class="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <span>ドット</span>
              </div>
            </div>

            <h3>プログレスバー</h3>
            <div class="progress-showcase">
              <div class="progress-item">
                <label>基本プログレス</label>
                <div class="progress">
                  <div class="progress-bar" style="width: 45%"></div>
                </div>
                <span>45%</span>
              </div>
              <div class="progress-item">
                <label>グラデーションプログレス</label>
                <div class="progress">
                  <div class="progress-bar progress-gradient" style="width: 78%"></div>
                </div>
                <span>78%</span>
              </div>
              <div class="progress-item">
                <label>ストライププログレス</label>
                <div class="progress">
                  <div class="progress-bar progress-striped" style="width: 62%"></div>
                </div>
                <span>62%</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('UIライブラリが読み込まれました')
})
</script>

<style scoped>
.ui-library {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-6);
  background: var(--bg-secondary);
  min-height: 100vh;
}

.library-header {
  text-align: center;
  margin-bottom: var(--spacing-12);
  padding: var(--spacing-8) 0;
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.library-header h1 {
  font-size: var(--text-4xl);
  margin-bottom: var(--spacing-4);
  font-weight: var(--font-weight-bold);
}

.header-description {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: var(--line-height-relaxed);
}

.library-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.component-section {
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.component-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.showcase-item {
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.showcase-item h3 {
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* ボタングリッド */
.button-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  align-items: center;
}

/* カードグリッド */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-4);
}

.card-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--spacing-3);
}

.card-stats {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* フォームショーケース */
.form-showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}

.form-column {
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.form-column h3 {
  margin-bottom: var(--spacing-4);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.modern-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-weight: var(--font-weight-normal) !important;
}

.form-checkbox {
  width: auto !important;
  margin: 0 !important;
}

.radio-group {
  display: flex;
  gap: var(--spacing-4);
}

.radio-label {
  display: flex !important;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-weight: var(--font-weight-normal) !important;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  position: relative;
}

.radio-label input[type="radio"]:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
}

.progress-text {
  margin-top: var(--spacing-1);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: right;
}

/* ナビゲーションショーケース */
.nav-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.nav-showcase h3 {
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.tab-nav {
  background: var(--bg-secondary);
  padding: var(--spacing-1);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.pill-nav {
  background: transparent;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.breadcrumb-item {
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-normal);
}

.breadcrumb-item:hover {
  color: var(--color-primary);
}

.breadcrumb-item.active {
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.breadcrumb-separator {
  color: var(--text-muted);
}

/* バッジショーケース */
.badge-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.badge-showcase h3 {
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}

.badge-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

/* アラートショーケース */
.alert-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.alert-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

/* ローディングショーケース */
.loading-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.loading-showcase h3 {
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.loading-grid {
  display: flex;
  gap: var(--spacing-6);
  align-items: center;
}

.loading-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
}

.loading-lg {
  width: 32px;
  height: 32px;
  border-width: 3px;
}

.loading-dots {
  display: flex;
  gap: var(--spacing-1);
}

.loading-dots div {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: loading-dots 1.4s ease-in-out infinite both;
}

.loading-dots div:nth-child(1) { animation-delay: -0.32s; }
.loading-dots div:nth-child(2) { animation-delay: -0.16s; }

@keyframes loading-dots {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.progress-showcase {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.progress-item label {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.progress-gradient {
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-accent));
}

.progress-striped {
  background: repeating-linear-gradient(
    45deg,
    var(--color-primary),
    var(--color-primary) 10px,
    var(--color-primary-light) 10px,
    var(--color-primary-light) 20px
  );
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 0 0; }
  100% { background-position: 40px 0; }
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .ui-library {
    padding: var(--spacing-4);
  }

  .library-header {
    padding: var(--spacing-6) var(--spacing-4);
  }

  .library-header h1 {
    font-size: var(--text-3xl);
  }

  .component-section {
    padding: var(--spacing-6);
  }

  .button-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .form-showcase {
    grid-template-columns: 1fr;
  }

  .loading-grid {
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .radio-group {
    flex-direction: column;
    gap: var(--spacing-2);
  }
}
</style>
