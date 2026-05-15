using UnityEngine;

/// <summary>
/// Represents a collectible coin in the game.
/// Moves down the screen and is destroyed when collected or off-screen.
/// </summary>
public class Coin : MonoBehaviour
{
    [SerializeField] private int coinValue = 10;
    [SerializeField] private float destroyYPosition = -5f;
    [SerializeField] private float rotationSpeed = 180f;
    
    private bool collected = false;
    private Rigidbody2D rb;

    private void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        if (rb == null)
        {
            rb = gameObject.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0f;
            rb.constraints = RigidbodyConstraints2D.FreezeRotation;
            rb.isKinematic = true;
        }
    }

    private void Update()
    {
        // Move coin down the screen
        MoveCoin();
        
        // Rotate coin for visual effect
        transform.Rotate(0, 0, rotationSpeed * Time.deltaTime);
        
        // Destroy if off-screen
        if (transform.position.y < destroyYPosition)
        {
            Destroy(gameObject);
        }
    }

    /// <summary>
    /// Moves the coin down the screen
    /// </summary>
    private void MoveCoin()
    {
        float gameSpeed = GameManager.Instance.GetGameSpeed();
        transform.Translate(Vector3.down * gameSpeed * Time.deltaTime);
    }

    /// <summary>
    /// Called when coin is collected by player
    /// </summary>
    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Player") && !collected)
        {
            CollectCoin();
        }
    }

    /// <summary>
    /// Handles coin collection
    /// </summary>
    private void CollectCoin()
    {
        collected = true;
        ScoreManager.Instance.AddCoins(coinValue);
        Debug.Log("Coin collected! +"+coinValue + " points");
        Destroy(gameObject);
    }

    /// <summary>
    /// Gets the coin value
    /// </summary>
    public int GetCoinValue()
    {
        return coinValue;
    }
}
