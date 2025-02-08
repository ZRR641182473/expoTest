import SwiftUI

struct Contact: Identifiable {
    let id = UUID()
    let name: String
    let phoneNumber: String
}

struct ContentView: View {
    @State private var contacts = [
        Contact(name: "张三", phoneNumber: "13800138000"),
        Contact(name: "李四", phoneNumber: "13900139000"),
        Contact(name: "王五", phoneNumber: "13700137000")
    ]
    
    var body: some View {
        NavigationView {
            List(contacts) { contact in
                ContactRow(contact: contact)
            }
            .navigationTitle("通讯录")
        }
    }
}

struct ContactRow: View {
    let contact: Contact
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(contact.name)
                    .font(.headline)
                Text(contact.phoneNumber)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Button(action: {
                makePhoneCall(phoneNumber: contact.phoneNumber)
            }) {
                Image(systemName: "phone.circle.fill")
                    .foregroundColor(.green)
                    .font(.system(size: 30))
            }
        }
        .padding(.vertical, 4)
    }
    
    func makePhoneCall(phoneNumber: String) {
        if let url = URL(string: "tel://\(phoneNumber)"),
           UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
    }
}

#Preview {
    ContentView()
} 