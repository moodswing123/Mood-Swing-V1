using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// Manages all UI elements and their updates.
/// Displays score, coins, pause menu, and game over screen.
/// </summary>
public class UIManager : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI scoreText;
    [SerializeField] private TextMeshProUGUI coinsText;
    [SerializeField] private TextMeshProUGUI distanceText;
    [SerializeField] private GameObject pauseMenuPanel;
    [SerializeField] private GameObject gameOverPanel;
    [SerializeField] private Button resumeButton;
    [SerializeField] private Button restartButton;
    [SerializeField] private Button quitButton;
    
    private bool uiInitialized = false;

    private void Start()
    {
        InitializeUI();
        SubscribeToEvents();
    }

    private void OnDestroy()
    {
        UnsubscribeFromEvents();
    }

    /// <summary>
    /// Initializes UI elements and their references
    /// </summary>
    private void InitializeUI()
    {
        if (pauseMenuPanel != null)
            pauseMenuPanel.SetActive(false);
        
        if (gameOverPanel != null)
            gameOverPanel.SetActive(false);
        
        // Assign button listeners
        if (resumeButton != null)
            resumeButton.onClick.AddListener(ResumeGame);
        
        if (restartButton != null)
            restartButton.onClick.AddListener(RestartGame);
        
        if (quitButton != null)
            quitButton.onClick.AddListener(QuitGame);
        
        uiInitialized = true;
    }

    /// <summary>
    /// Subscribes to game manager and score manager events
    /// </summary>
    private void SubscribeToEvents()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnGameStateChanged += HandleGameStateChanged;
            GameManager.Instance.OnGamePaused += HandleGamePaused;
        }
        
        if (ScoreManager.Instance != null)
        {
            ScoreManager.Instance.OnScoreUpdated += UpdateScoreDisplay;
            ScoreManager.Instance.OnCoinsCollected += UpdateCoinsDisplay;
        }
    }

    /// <summary>
    /// Unsubscribes from game manager and score manager events
    /// </summary>
    private void UnsubscribeFromEvents()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnGameStateChanged -= HandleGameStateChanged;
            GameManager.Instance.OnGamePaused -= HandleGamePaused;
        }
        
        if (ScoreManager.Instance != null)
        {
            ScoreManager.Instance.OnScoreUpdated -= UpdateScoreDisplay;
            ScoreManager.Instance.OnCoinsCollected -= UpdateCoinsDisplay;
        }
    }

    /// <summary>
    /// Updates score display
    /// </summary>
    private void UpdateScoreDisplay(int score)
    {
        if (scoreText != null)
            scoreText.text = "Score: " + score;
        
        if (distanceText != null)
        {
            float distance = ScoreManager.Instance.GetDistanceTraveled();
            distanceText.text = "Distance: " + distance.ToString("F1") + "m";
        }
    }

    /// <summary>
    /// Updates coins display
    /// </summary>
    private void UpdateCoinsDisplay(int coins)
    {
        if (coinsText != null)
            coinsText.text = "Coins: " + coins;
    }

    /// <summary>
    /// Handles game state changes
    /// </summary>
    private void HandleGameStateChanged(bool isActive)
    {
        if (!isActive)
        {
            ShowGameOverPanel();
        }
    }

    /// <summary>
    /// Handles game pause state changes
    /// </summary>
    private void HandleGamePaused(bool isPaused)
    {
        if (pauseMenuPanel != null)
            pauseMenuPanel.SetActive(isPaused);
    }

    /// <summary>
    /// Shows the game over panel
    /// </summary>
    private void ShowGameOverPanel()
    {
        if (gameOverPanel != null)
            gameOverPanel.SetActive(true);
    }

    /// <summary>
    /// Resumes the game
    /// </summary>
    private void ResumeGame()
    {
        GameManager.Instance.TogglePause();
    }

    /// <summary>
    /// Restarts the game
    /// </summary>
    private void RestartGame()
    {
        Time.timeScale = 1f;
        UnityEngine.SceneManagement.SceneManager.LoadScene(
            UnityEngine.SceneManagement.SceneManager.GetActiveScene().name);
    }

    /// <summary>
    /// Quits the game
    /// </summary>
    private void QuitGame()
    {
        Time.timeScale = 1f;
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }
}
