<script lang="ts">
  interface LoyaltyRule {
    id: string;
    emoji: string;
    title: string;
    description: string;
    example?: string;
    list?: string[];
  }

  interface LoyaltyRulesData {
    title: string;
    icon: string;
    rules: LoyaltyRule[];
    footer: string;
  }

  interface Props {
    rulesData: LoyaltyRulesData;
  }

  let { rulesData }: Props = $props();
</script>

<div class="loyalty-rules-card">
  <div class="loyalty-rules-header">
    <div class="loyalty-rules-icon">{rulesData.icon}</div>
    <h3>{rulesData.title}</h3>
  </div>

  {#each rulesData.rules as rule}
    <div class="loyalty-rule-item">
      <div class="loyalty-rule-emoji">{rule.emoji}</div>
      <div class="loyalty-rule-content">
        <h4>{rule.title}</h4>
        {#if rule.description}
          <p>{@html rule.description}</p>
        {/if}
        {#if rule.example}
          <div class="loyalty-rule-example">{rule.example}</div>
        {/if}
        {#if rule.list}
          <ul class="loyalty-rule-list">
            {#each rule.list as item}
              <li>{@html item}</li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  {/each}

  <div class="loyalty-rule-footer">
    <p>{rulesData.footer}</p>
  </div>
</div>

<style>
  .loyalty-rules-card {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 24px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
    margin-bottom: 16px;
  }

  .loyalty-rules-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .loyalty-rules-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .loyalty-rules-header h3 {
    font-size: 20px;
    font-weight: bold;
    color: var(--text-primary);
    margin: 0;
  }

  .loyalty-rule-item {
    display: flex;
    gap: 16px;
    padding: 20px 0;
    border-bottom: 1px solid var(--border-color);
  }

  .loyalty-rule-item:last-of-type {
    border-bottom: none;
  }

  .loyalty-rule-emoji {
    font-size: 32px;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loyalty-rule-content {
    flex: 1;
  }

  .loyalty-rule-content h4 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }

  .loyalty-rule-content p {
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 12px 0;
  }

  .loyalty-rule-example {
    background: var(--bg-secondary);
    border-left: 3px solid var(--primary-orange);
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    color: var(--text-secondary);
    font-style: italic;
  }

  .loyalty-rule-list {
    margin: 0;
    padding-left: 20px;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.8;
  }

  .loyalty-rule-list li {
    margin-bottom: 8px;
  }

  .loyalty-rule-list li:last-child {
    margin-bottom: 0;
  }

  .loyalty-rule-footer {
    margin-top: 20px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 107, 0, 0.1), rgba(255, 69, 0, 0.05));
    border-radius: 12px;
    text-align: center;
  }

  .loyalty-rule-footer p {
    color: var(--text-primary);
    font-size: 15px;
    font-weight: 500;
    margin: 0;
  }

  @media (max-width: 480px) {
    .loyalty-rules-card {
      padding: 20px 16px;
    }

    .loyalty-rules-header h3 {
      font-size: 18px;
    }

    .loyalty-rule-item {
      gap: 12px;
      padding: 16px 0;
    }

    .loyalty-rule-emoji {
      font-size: 28px;
      width: 40px;
      height: 40px;
    }

    .loyalty-rule-content h4 {
      font-size: 16px;
    }

    .loyalty-rule-content p {
      font-size: 14px;
    }

    .loyalty-rule-example {
      font-size: 13px;
      padding: 8px 12px;
    }

    .loyalty-rule-list {
      font-size: 14px;
    }
  }
</style>
