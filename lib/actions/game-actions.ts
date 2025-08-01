"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

export async function createAttempt() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const userId = user ? user.id : null

  const { data, error } = await supabase
    .from("attempts")
    .insert({ user_id: userId })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating attempt:", error)
    throw new Error("Could not start a new attempt.")
  }
  return data.id
}

export async function addUserAnswer(payload: {
  attemptId: string
  questionId: string | null
  submittedAnswer: string
  isCorrect: boolean
}) {
  const { attemptId, questionId, submittedAnswer, isCorrect } = payload
  const supabase = createClient()

  const { error } = await supabase.from("user_answers").insert({
    attempt_id: attemptId,
    question_id: questionId,
    submitted_answer: submittedAnswer,
    is_correct: isCorrect
  })

  if (error) {
    console.error("Error adding user answer:", error)
  }
}

export async function finishAttempt(payload: {
  attemptId: string
  correctCount: number
  totalCount: number
}) {
  const { attemptId, correctCount, totalCount } = payload
  const supabase = createClient()

  const percentage = totalCount > 0 ? (correctCount / totalCount) * 100 : 0

  const { error } = await supabase
    .from("attempts")
    .update({
      correct_count: correctCount,
      total_count: totalCount,
      percentage: percentage.toFixed(2)
    })
    .eq("id", attemptId)

  if (error) {
    console.error("Error finishing attempt:", error)
    throw new Error("Could not save final score.")
  }
  revalidatePath("/attempts")
}

export async function getRandomQuestion() {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("get_random_question")

  if (error || !data || data.length === 0) {
    console.error("Error fetching random question, using fallback:", error)
    return {
      id: "fallback-id-1",
      question_text: "2 + 2 = ?",
      correct_answer: "4"
    }
  }
  return data[0]
}
