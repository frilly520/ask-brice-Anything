package com.example.askbrice.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.askbrice.ui.theme.BorderDark
import com.example.askbrice.ui.theme.CrimsonPrimary
import com.example.askbrice.ui.theme.DarkSurface
import com.example.askbrice.ui.theme.GoldSecondary
import com.example.askbrice.ui.theme.TextPrimary
import com.example.askbrice.ui.theme.TextSecondary

data class StarterPrompt(
    val title: String,
    val prompt: String,
    val iconEmoji: String
)

val STARTER_PROMPTS = listOf(
    StarterPrompt(
        title = "Business Reality Check",
        prompt = "Call out every flaw in this business idea: A subscription box for used socks.",
        iconEmoji = "💼"
    ),
    StarterPrompt(
        title = "Excuse Destroyer",
        prompt = "I keep procrastinating on going to the gym because I'm 'too busy'. Roast me and tell me what to do.",
        iconEmoji = "🔥"
    ),
    StarterPrompt(
        title = "Am I The Problem?",
        prompt = "My coworker took credit for my presentation and I didn't say anything because I wanted to keep peace. Did I handle this like a coward?",
        iconEmoji = "⚖️"
    ),
    StarterPrompt(
        title = "Resume Roast",
        prompt = "Give me brutal feedback: What are the biggest red flags on a resume that scream 'unemployable'?",
        iconEmoji = "📄"
    )
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PromptStarters(
    onSelectPrompt: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier.padding(bottom = 12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ElectricBolt,
                contentDescription = null,
                tint = CrimsonPrimary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "REALITY CHECKS",
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 1.2.sp,
                    color = CrimsonPrimary
                )
            )
        }

        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            maxItemsInEachRow = 2
        ) {
            STARTER_PROMPTS.forEachIndexed { index, item ->
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("prompt_starter_${index}")
                        .clickable { onSelectPrompt(item.prompt) },
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = DarkSurface),
                    border = BorderStroke(1.dp, BorderDark)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Text(text = item.iconEmoji, fontSize = 20.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = item.title,
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = item.prompt.take(38) + "...",
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
            }
        }
    }
}
