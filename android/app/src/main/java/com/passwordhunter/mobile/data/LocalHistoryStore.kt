package com.passwordhunter.mobile.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.passwordhunter.mobile.network.SimulationHistory
import java.util.UUID

/**
 * Persists simulation history locally when the backend is unavailable.
 */
class LocalHistoryStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()
    private val listType = object : TypeToken<List<SimulationHistory>>() {}.type

    fun getAll(): List<SimulationHistory> {
        val json = prefs.getString(KEY_ITEMS, null) ?: return emptyList()
        return runCatching { gson.fromJson<List<SimulationHistory>>(json, listType) }.getOrDefault(emptyList())
    }

    fun save(item: SimulationHistory): SimulationHistory {
        val withId = if (item.id.isNullOrBlank()) item.copy(id = UUID.randomUUID().toString()) else item
        val items = getAll().toMutableList()
        items.add(0, withId)
        persist(items)
        return withId
    }

    fun delete(id: String) {
        persist(getAll().filter { it.id != id })
    }

    fun clear() {
        prefs.edit().remove(KEY_ITEMS).apply()
    }

    private fun persist(items: List<SimulationHistory>) {
        prefs.edit().putString(KEY_ITEMS, gson.toJson(items)).apply()
    }

    companion object {
        private const val PREFS_NAME = "password-hunter-local-history"
        private const val KEY_ITEMS = "items"
    }
}
