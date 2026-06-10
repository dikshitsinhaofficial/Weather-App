package com.gp.weatherapp

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.Composable
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier


class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            WebViewScreen()
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen() {

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                webViewClient = WebViewClient()
                loadUrl("file:///android_asset/index.html")
            }
        }
    )
}