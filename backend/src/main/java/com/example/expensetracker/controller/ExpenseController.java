package com.example.expensetracker.controller;

import com.example.expensetracker.entity.Account;
import com.example.expensetracker.entity.Expense;
import com.example.expensetracker.repository.AccountRepository;
import com.example.expensetracker.repository.ExpenseRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174"
})
public class ExpenseController {

    private final ExpenseRepository expenseRepository;
    private final AccountRepository accountRepository;

    public ExpenseController(
            ExpenseRepository expenseRepository,
            AccountRepository accountRepository) {

        this.expenseRepository = expenseRepository;
        this.accountRepository = accountRepository;
    }

    @PostMapping
    public Expense addExpense(@RequestBody Expense expense) {

        if (expense.getAccount() != null &&
                expense.getAccount().getId() != null) {

            Account account = accountRepository
                    .findById(expense.getAccount().getId())
                    .orElseThrow();

            expense.setAccount(account);
        }

        return expenseRepository.save(expense);
    }

    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    @PutMapping("/{id}")
    public Expense updateExpense(
            @PathVariable Long id,
            @RequestBody Expense updatedExpense) {

        Expense expense = expenseRepository
                .findById(id)
                .orElseThrow();

        expense.setTitle(updatedExpense.getTitle());
        expense.setAmount(updatedExpense.getAmount());
        expense.setCategory(updatedExpense.getCategory());
        expense.setRecurring(updatedExpense.isRecurring());
        expense.setRecurrence(updatedExpense.getRecurrence());
        expense.setDueDate(updatedExpense.getDueDate());

        if (updatedExpense.getAccount() != null &&
                updatedExpense.getAccount().getId() != null) {

            Account account = accountRepository
                    .findById(updatedExpense.getAccount().getId())
                    .orElseThrow();

            expense.setAccount(account);
        }

        return expenseRepository.save(expense);
    }

    @GetMapping("/{id}")
    public Expense getExpenseById(@PathVariable Long id) {
        return expenseRepository
                .findById(id)
                .orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable Long id) {
        expenseRepository.deleteById(id);
    }
}