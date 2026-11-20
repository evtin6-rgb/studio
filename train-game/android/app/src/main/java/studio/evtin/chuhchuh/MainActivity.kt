package studio.evtin.chuhchuh

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

/**
 * Единственный экран: WebView с игрой из assets/web и мост к Google Play Billing.
 * Игра загружается с https://appassets.androidplatform.net через WebViewAssetLoader,
 * поэтому localStorage и WebAudio работают как в обычном браузере.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var billing: BillingManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        webView = WebView(this)
        setContentView(webView)
        hideSystemBars()

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.host == WebViewAssetLoader.DEFAULT_DOMAIN) return false
                // Все внешние ссылки (они только в разделе для взрослых) — во внешний браузер
                openExternal(request.url)
                return true
            }
        }
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            setSupportZoom(false)
            textZoom = 100
        }
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        billing = BillingManager(applicationContext) { js ->
            runOnUiThread { if (!isDestroyed) webView.evaluateJavascript(js, null) }
        }
        webView.addJavascriptInterface(Bridge(), "AndroidBilling")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("(window.handleBack && window.handleBack()) ? 'y' : 'n'") { result ->
                    if (result != "\"y\"") finish()
                }
            }
        })

        webView.loadUrl("https://${WebViewAssetLoader.DEFAULT_DOMAIN}/assets/web/index.html")
        billing.start()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        hideSystemBars()
        // Подписка могла измениться (отмена, продление) — обновляем статус
        billing.refresh()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    override fun onDestroy() {
        billing.end()
        webView.destroy()
        super.onDestroy()
    }

    private fun hideSystemBars() {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    private fun openExternal(uri: Uri) {
        if (uri.scheme != "https" && uri.scheme != "mailto") return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            // Нет браузера — просто ничего не делаем
        }
    }

    /** Методы, доступные из JavaScript как window.AndroidBilling.* (вызываются не в UI-потоке). */
    inner class Bridge {
        @JavascriptInterface
        fun refresh() = billing.refresh()

        @JavascriptInterface
        fun restore() = billing.restore()

        @JavascriptInterface
        fun purchase(planId: String) = runOnUiThread { billing.launchPurchase(this@MainActivity, planId) }

        @JavascriptInterface
        fun manage() = runOnUiThread {
            openExternal(
                Uri.parse("https://play.google.com/store/account/subscriptions")
                    .buildUpon()
                    .appendQueryParameter("sku", BillingManager.PRODUCT_ID)
                    .appendQueryParameter("package", packageName)
                    .build()
            )
        }
    }
}
