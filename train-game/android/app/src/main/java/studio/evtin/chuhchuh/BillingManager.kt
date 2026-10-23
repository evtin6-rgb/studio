package studio.evtin.chuhchuh

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONArray
import org.json.JSONObject

/**
 * Подписка «Чух-Чух! Плюс» через Google Play Billing Library 8.
 *
 * В Play Console нужно создать подписку с ID [PRODUCT_ID] и двумя базовыми планами:
 *   - "monthly" (ежемесячно)
 *   - "yearly"  (ежегодно) + предложение с бесплатным пробным периодом (например, 7 дней)
 *
 * Результаты отправляются в JavaScript: window.__billing.onState / onProducts / onError / onCancel.
 */
class BillingManager(
    context: Context,
    private val emitJs: (String) -> Unit,
) : PurchasesUpdatedListener {

    companion object {
        const val PRODUCT_ID = "chuh_plus"
    }

    private val client: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()

    @Volatile private var productDetails: ProductDetails? = null
    @Volatile private var started = false

    fun start() {
        if (started) return
        started = true
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts()
                    queryPurchases(restored = false)
                } else {
                    started = false
                }
            }

            override fun onBillingServiceDisconnected() {
                // Переподключение выполняется автоматически (enableAutoServiceReconnection)
            }
        })
    }

    fun end() = client.endConnection()

    fun refresh() {
        if (!client.isReady) { start(); return }
        if (productDetails == null) queryProducts()
        queryPurchases(restored = false)
    }

    fun restore() {
        if (!client.isReady) {
            start()
            reportError("Google Play недоступен. Проверьте, что вы вошли в аккаунт Google, и попробуйте ещё раз.")
            return
        }
        queryPurchases(restored = true)
    }

    private fun queryProducts() {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                )
            )
            .build()
        client.queryProductDetailsAsync(params) { result, detailsResult ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) return@queryProductDetailsAsync
            val details = detailsResult.productDetailsList.firstOrNull { it.productId == PRODUCT_ID }
                ?: return@queryProductDetailsAsync
            productDetails = details

            val plans = JSONArray()
            details.subscriptionOfferDetails.orEmpty()
                .groupBy { it.basePlanId }
                .forEach { (planId, offers) ->
                    val offer = bestOffer(offers) ?: return@forEach
                    val phases = offer.pricingPhases.pricingPhaseList
                    val recurring = phases.last()
                    val trial = phases.firstOrNull { it.priceAmountMicros == 0L }
                    plans.put(
                        JSONObject()
                            .put("planId", planId)
                            .put("price", recurring.formattedPrice)
                            .put("period", recurring.billingPeriod)
                            .put("trial", trial?.billingPeriod ?: JSONObject.NULL)
                    )
                }
            emit("onProducts", plans.toString())
        }
    }

    /** Play возвращает только те предложения, на которые пользователь имеет право; предпочитаем пробный период. */
    private fun bestOffer(offers: List<ProductDetails.SubscriptionOfferDetails>) =
        offers.firstOrNull { o -> o.pricingPhases.pricingPhaseList.any { it.priceAmountMicros == 0L } }
            ?: offers.firstOrNull { it.offerId == null }
            ?: offers.firstOrNull()

    fun launchPurchase(activity: Activity, planId: String) {
        val details = productDetails
        if (details == null) {
            refresh()
            reportError("Цены ещё загружаются. Попробуйте через пару секунд.")
            return
        }
        val offer = bestOffer(details.subscriptionOfferDetails.orEmpty().filter { it.basePlanId == planId })
        if (offer == null) {
            reportError("Этот план сейчас недоступен.")
            return
        }
        val flow = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .setOfferToken(offer.offerToken)
                        .build()
                )
            )
            .build()
        val result = client.launchBillingFlow(activity, flow)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            reportError("Не удалось открыть оплату (${result.responseCode}).")
        }
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> handlePurchases(purchases.orEmpty(), fresh = true, restored = false)
            BillingClient.BillingResponseCode.USER_CANCELED -> emit("onCancel", "")
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> queryPurchases(restored = true)
            else -> reportError("Покупка не завершена. Попробуйте позже.")
        }
    }

    private fun queryPurchases(restored: Boolean) {
        val params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build()
        client.queryPurchasesAsync(params) { result, purchases ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                handlePurchases(purchases, fresh = false, restored = restored)
            } else if (restored) {
                reportError("Не удалось проверить покупки. Попробуйте позже.")
            }
        }
    }

    private fun handlePurchases(purchases: List<Purchase>, fresh: Boolean, restored: Boolean) {
        val ours = purchases.filter { PRODUCT_ID in it.products }
        val active = ours.any { it.purchaseState == Purchase.PurchaseState.PURCHASED }
        val pending = ours.any { it.purchaseState == Purchase.PurchaseState.PENDING }

        // Подписку нужно подтвердить в течение 3 дней, иначе Google вернёт деньги
        ours.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED && !it.isAcknowledged }.forEach { p ->
            client.acknowledgePurchase(
                AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()
            ) { /* при ошибке подтвердим при следующем запуске */ }
        }

        val state = JSONObject()
            .put("premium", active)
            .put("pending", pending && !active)
            .put("fresh", fresh)
            .put("restored", restored)
        emit("onState", state.toString())
    }

    private fun reportError(message: String) = emit("onError", JSONObject.quote(message))

    private fun emit(fn: String, arg: String) {
        emitJs("window.__billing && window.__billing.$fn($arg)")
    }
}
